<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OrderAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BuyerOrderController extends Controller
{
    public function __construct(private OrderAccess $access) {}

    public function index(Request $request): JsonResponse
    {
        $customerId = DB::table('pelanggan')->where('id_user', $request->user()->id_user)->value('id_pelanggan');
        $orders = DB::table('pesanan')->where('id_pelanggan', $customerId)->orderByDesc('id_pesanan')->paginate(20, ['kode_pesanan', 'tanggal', 'status_pesanan', 'status_penawaran', 'total', 'mata_uang']);

        return response()->json(['data' => $orders]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nama' => 'required|string|max:100',
            'no_hp' => 'required|string|max:20|regex:/^[+0-9 ()-]{6,20}$/',
            'alamat' => 'required|string|max:2000',
            'negara' => 'required|string|max:50',
            'tipe_pembeli' => 'required|in:perorangan,restoran,luar_negeri',
            'catatan' => 'nullable|string|max:2000',
            'items' => 'required|array|min:1|max:50',
            'items.*.id_produk' => 'required|integer|distinct|exists:produk_lobster,id_produk',
            'items.*.jumlah' => 'required|numeric|min:0.01|max:100000|decimal:0,2',
        ]);
        $user = $request->user('sanctum');
        $token = Str::random(64);

        $code = DB::transaction(function () use ($data, $user, $token): string {
            $profile = array_intersect_key($data, array_flip(['nama', 'no_hp', 'alamat', 'negara', 'tipe_pembeli']));
            $items = [];
            $total = 0;
            foreach ($data['items'] as $index => $item) {
                $product = DB::table('produk_lobster')->where('id_produk', $item['id_produk'])->lockForUpdate()->first();
                $minimum = $product->satuan === 'paket' ? 1 : match ($data['tipe_pembeli']) {
                    'restoran' => (float) ($product->moq_restoran ?? 1),
                    'luar_negeri' => (float) ($product->moq_luar_negeri ?? 1),
                    default => 1,
                };
                if ((float) $item['jumlah'] < $minimum || ($product->satuan === 'paket' && (float) $item['jumlah'] !== floor((float) $item['jumlah']))) {
                    throw ValidationException::withMessages(["items.$index.jumlah" => "Minimal pembelian {$product->nama_produk} adalah $minimum {$product->satuan}; paket harus dalam jumlah bulat."]);
                }
                if ((float) $item['jumlah'] > (float) $product->stok) {
                    throw ValidationException::withMessages(["items.$index.jumlah" => "Stok {$product->nama_produk} tidak mencukupi."]);
                }
                $subtotal = (int) round((float) $item['jumlah'] * (int) $product->harga);
                $total += $subtotal;
                $items[] = ['id_produk' => $product->id_produk, 'nama_produk' => $product->nama_produk, 'satuan' => $product->satuan, 'jumlah' => $item['jumlah'], 'harga_satuan' => $product->harga, 'subtotal' => $subtotal];
            }
            abort_if($total <= 0 || $total > 9000000000, 422, 'Nilai pesanan di luar batas yang didukung.');
            $customerId = $user ? DB::table('pelanggan')->where('id_user', $user->id_user)->value('id_pelanggan') : null;
            if ($customerId === null) {
                $customerId = DB::table('pelanggan')->insertGetId(array_merge($profile, ['id_user' => $user?->id_user, 'created_at' => now(), 'updated_at' => now()]), 'id_pelanggan');
            }
            $code = 'TF-'.Str::upper(Str::random(12));
            $orderId = DB::table('pesanan')->insertGetId([
                'kode_pesanan' => $code, 'id_pelanggan' => $customerId, 'tanggal' => now(), 'status_pesanan' => 'menunggu_persetujuan',
                'mata_uang' => 'IDR', 'total' => $total, 'catatan' => $data['catatan'] ?? null,
                'data_pengiriman' => json_encode($profile), 'token_akses_hash' => $user ? null : hash('sha256', $token),
                'created_at' => now(), 'updated_at' => now(),
            ], 'id_pesanan');
            foreach ($items as $item) {
                DB::table('detail_pesanan')->insert(array_merge($item, ['id_pesanan' => $orderId, 'created_at' => now(), 'updated_at' => now()]));
            }

            return $code;
        });

        return response()->json(['data' => ['kode_pesanan' => $code, 'token_akses' => $user ? null : $token], 'message' => 'Pesanan diajukan. Tunggu penawaran dari admin.'], 201);
    }

    public function show(Request $request, string $code): JsonResponse
    {
        return response()->json(['data' => $this->access->detail($this->access->authorize($request, $code))]);
    }

    public function decision(Request $request, string $code): JsonResponse
    {
        $data = $request->validate(['keputusan' => 'required|in:diterima,ditolak', 'versi_penawaran' => 'required|integer|min:0']);
        DB::transaction(function () use ($request, $code, $data): void {
            $order = $this->access->authorize($request, $code, true);
            abort_unless($order->status_penawaran === 'menunggu' && $order->status_pesanan === 'disetujui', 409, 'Penawaran sudah dijawab atau belum tersedia.');
            abort_unless((int) $data['versi_penawaran'] === (int) $order->versi_penawaran, 409, 'Penawaran telah direvisi admin. Perbarui halaman dan periksa harga terbaru.');
            if ($data['keputusan'] === 'diterima') {
                $items = DB::table('detail_pesanan')->where('id_pesanan', $order->id_pesanan)->orderBy('id_produk')->get();
                foreach ($items as $item) {
                    $product = DB::table('produk_lobster')->where('id_produk', $item->id_produk)->lockForUpdate()->first();
                    abort_if($product === null || (float) $product->stok < (float) $item->jumlah, 409, 'Stok berubah. Hubungi admin untuk revisi penawaran.');
                    DB::table('produk_lobster')->where('id_produk', $item->id_produk)->decrement('stok', $item->jumlah);
                }
            }
            DB::table('pesanan')->where('id_pesanan', $order->id_pesanan)->update([
                'status_penawaran' => $data['keputusan'], 'penawaran_dijawab_at' => now(),
                'status_pesanan' => $data['keputusan'] === 'diterima' ? 'menunggu_dp' : 'ditolak', 'updated_at' => now(),
            ]);
        });

        return $this->show($request, $code);
    }

    public function received(Request $request, string $code): JsonResponse
    {
        DB::transaction(function () use ($request, $code): void {
            $order = $this->access->authorize($request, $code, true);
            $shipment = DB::table('pengiriman')->where('id_pesanan', $order->id_pesanan)->first();
            abort_unless($shipment !== null && $shipment->status_pengiriman === 'dikirim', 409, 'Pesanan belum dikirim atau sudah diterima.');
            $paid = DB::table('pembayaran')->where('id_pesanan', $order->id_pesanan)->where('status_bayar', 'dibayar')->sum('jumlah');
            DB::table('pengiriman')->where('id_pesanan', $order->id_pesanan)->update(['status_pengiriman' => 'diterima', 'tanggal_terima' => now()->toDateString(), 'updated_at' => now()]);
            DB::table('pesanan')->where('id_pesanan', $order->id_pesanan)->update(['status_pesanan' => (float) $paid >= (float) $order->total ? 'lunas' : 'menunggu_pelunasan', 'updated_at' => now()]);
        });

        return $this->show($request, $code);
    }
}

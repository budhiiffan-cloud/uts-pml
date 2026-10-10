<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OrderAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminOrderController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => DB::table('pesanan')->orderByDesc('id_pesanan')->paginate(20, ['kode_pesanan', 'tanggal', 'total', 'status_pesanan', 'status_penawaran', 'mata_uang'])]);
    }

    public function show(string $code, OrderAccess $access): JsonResponse
    {
        $order = DB::table('pesanan')->where('kode_pesanan', $code)->first();
        abort_if($order === null, 404);

        return response()->json(['data' => $access->detail($order)]);
    }

    public function offer(Request $request, string $code): JsonResponse
    {
        $data = $request->validate([
            'biaya_pengiriman' => 'required|integer|min:0|max:1000000000',
            'catatan_penawaran' => 'nullable|string|max:2000',
            'items' => 'required|array|min:1|max:50',
            'items.*.id_detail' => 'required|integer|distinct',
            'items.*.harga_satuan' => 'required|integer|min:1|max:1000000000',
        ]);
        DB::transaction(function () use ($code, $data): void {
            $order = DB::table('pesanan')->where('kode_pesanan', $code)->lockForUpdate()->first();
            abort_if($order === null, 404);
            abort_unless(in_array($order->status_pesanan, ['menunggu_persetujuan', 'disetujui'], true) && $order->status_penawaran !== 'diterima', 409, 'Pesanan tidak dapat diberi penawaran lagi.');
            $items = DB::table('detail_pesanan')->where('id_pesanan', $order->id_pesanan)->get()->keyBy('id_detail');
            abort_unless($items->count() === count($data['items']), 422, 'Semua produk pesanan harus disertakan.');
            $total = $data['biaya_pengiriman'];
            foreach ($data['items'] as $item) {
                $detail = $items->get($item['id_detail']);
                abort_if($detail === null, 422, 'Produk penawaran tidak termasuk dalam pesanan ini.');
                $subtotal = (int) round((float) $detail->jumlah * $item['harga_satuan']);
                abort_if($subtotal > 9000000000, 422, 'Nilai produk penawaran terlalu besar.');
                $total += $subtotal;
                DB::table('detail_pesanan')->where('id_detail', $detail->id_detail)->update(['harga_satuan' => $item['harga_satuan'], 'subtotal' => $subtotal, 'updated_at' => now()]);
            }
            abort_if($total > 9000000000, 422, 'Nilai penawaran terlalu besar.');
            DB::table('pesanan')->where('id_pesanan', $order->id_pesanan)->update([
                'total' => $total, 'biaya_pengiriman' => $data['biaya_pengiriman'], 'catatan_penawaran' => $data['catatan_penawaran'] ?? null,
                'status_penawaran' => 'menunggu', 'status_pesanan' => 'disetujui', 'penawaran_dikirim_at' => now(), 'updated_at' => now(),
                'versi_penawaran' => $order->versi_penawaran + 1,
            ]);
        });

        return response()->json(['message' => 'Penawaran dikirim ke pembeli.']);
    }

    public function reject(Request $request, string $code): JsonResponse
    {
        $data = $request->validate(['alasan' => 'required|string|max:2000']);
        DB::transaction(function () use ($code, $data): void {
            $order = DB::table('pesanan')->where('kode_pesanan', $code)->lockForUpdate()->first();
            abort_if($order === null, 404);
            abort_unless(in_array($order->status_pesanan, ['menunggu_persetujuan', 'disetujui'], true), 409, 'Pesanan ini tidak dapat ditolak.');
            DB::table('pesanan')->where('id_pesanan', $order->id_pesanan)->update(['status_pesanan' => 'ditolak', 'status_penawaran' => 'ditolak', 'catatan_penawaran' => $data['alasan'], 'updated_at' => now()]);
        });

        return response()->json(['message' => 'Pesanan ditolak.']);
    }

    public function shipment(Request $request, string $code): JsonResponse
    {
        $data = $request->validate(['kurir' => 'required|string|max:100', 'no_resi' => 'required|string|max:100']);
        DB::transaction(function () use ($code, $data): void {
            $order = DB::table('pesanan')->where('kode_pesanan', $code)->lockForUpdate()->first();
            abort_if($order === null, 404);
            abort_unless($order->status_penawaran === 'diterima' && DB::table('pembayaran')->where('id_pesanan', $order->id_pesanan)->where('jenis', 'dp')->where('status_bayar', 'dibayar')->exists(), 409, 'DP harus dibayar sebelum pengiriman.');
            $shipment = DB::table('pengiriman')->where('id_pesanan', $order->id_pesanan)->first();
            abort_if($shipment?->status_pengiriman === 'diterima', 409, 'Pesanan sudah diterima.');
            DB::table('pengiriman')->updateOrInsert(['id_pesanan' => $order->id_pesanan], array_merge($data, ['status_pengiriman' => 'dikirim', 'tanggal_kirim' => now()->toDateString(), 'updated_at' => now()]));
            DB::table('pesanan')->where('id_pesanan', $order->id_pesanan)->update(['status_pesanan' => 'dikirim', 'updated_at' => now()]);
        });

        return response()->json(['message' => 'Informasi pengiriman disimpan.']);
    }
}

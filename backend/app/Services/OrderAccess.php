<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use stdClass;

class OrderAccess
{
    public function authorize(Request $request, string $code, bool $lock = false): stdClass
    {
        $query = DB::table('pesanan')->where('kode_pesanan', $code);
        $order = ($lock ? $query->lockForUpdate() : $query)->first();
        abort_if($order === null, 404, 'Pesanan tidak ditemukan.');
        $user = $request->user('sanctum');

        if ($user !== null) {
            $customer = DB::table('pelanggan')->where('id_pelanggan', $order->id_pelanggan)->first();
            if ($user->role === 'pelanggan' && $customer !== null && (int) $customer->id_user === (int) $user->id_user) {
                return $order;
            }
        }

        $token = (string) $request->header('X-Order-Token', '');
        abort_unless($token !== '' && $order->token_akses_hash !== null && hash_equals($order->token_akses_hash, hash('sha256', $token)), 404, 'Pesanan tidak ditemukan atau akses tidak valid.');

        return $order;
    }

    public function detail(stdClass $order): array
    {
        $data = (array) $order;
        unset($data['token_akses_hash']);
        $data['data_pengiriman'] = $order->data_pengiriman ? json_decode($order->data_pengiriman, true) : null;
        $data['items'] = DB::table('detail_pesanan')->where('id_pesanan', $order->id_pesanan)->orderBy('id_detail')->get();
        $data['pembayaran'] = DB::table('pembayaran')->where('id_pesanan', $order->id_pesanan)
            ->orderByDesc('id_pembayaran')->get(['id_pembayaran', 'jenis', 'metode', 'jumlah', 'mata_uang', 'status_bayar', 'waktu_bayar']);
        $data['pengiriman'] = DB::table('pengiriman')->where('id_pesanan', $order->id_pesanan)->first();
        $data['total_dibayar'] = DB::table('pembayaran')->where('id_pesanan', $order->id_pesanan)->where('status_bayar', 'dibayar')->sum('jumlah');
        $data['pembayaran_aktif'] = (bool) config('services.midtrans.server_key');
        $data['dp_persen'] = max(1, min(99, (int) config('services.midtrans.dp_percent', 50)));
        $data['nominal_dp'] = (int) ceil((float) $order->total * $data['dp_persen'] / 100);

        return $data;
    }
}

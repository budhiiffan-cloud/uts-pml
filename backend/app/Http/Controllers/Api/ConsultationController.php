<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use stdClass;

class ConsultationController extends Controller
{
    public function start(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');
        if ($user !== null) {
            abort_unless($user->role === 'pelanggan', 403);
            $customerId = DB::table('pelanggan')->where('id_user', $user->id_user)->value('id_pelanggan');
            abort_if($customerId === null, 422, 'Lengkapi profil pelanggan terlebih dahulu.');

            return response()->json(['data' => ['id_pelanggan' => $customerId, 'token_konsultasi' => null]]);
        }
        $data = $request->validate(['nama' => 'required|string|max:100', 'no_hp' => 'required|string|max:20|regex:/^[+0-9 ()-]{6,20}$/']);
        $token = Str::random(64);
        $id = DB::table('pelanggan')->insertGetId(array_merge($data, ['tipe_pembeli' => 'perorangan', 'token_konsultasi_hash' => hash('sha256', $token), 'created_at' => now(), 'updated_at' => now()]), 'id_pelanggan');

        return response()->json(['data' => ['id_pelanggan' => $id, 'token_konsultasi' => $token]], 201);
    }

    private function authorizeThread(Request $request, int $id): stdClass
    {
        $customer = DB::table('pelanggan')->where('id_pelanggan', $id)->first();
        abort_if($customer === null, 404);
        $user = $request->user('sanctum');
        if ($user !== null && ($user->role === 'admin' || ($user->role === 'pelanggan' && (int) $customer->id_user === (int) $user->id_user))) {
            return $customer;
        }
        $token = (string) $request->header('X-Chat-Token', '');
        abort_unless($token !== '' && $customer->token_konsultasi_hash !== null && hash_equals($customer->token_konsultasi_hash, hash('sha256', $token)), 404);

        return $customer;
    }

    public function messages(Request $request, int $id): JsonResponse
    {
        $this->authorizeThread($request, $id);
        $messages = DB::table('konsultasi')->where('id_pelanggan', $id)->orderByDesc('id_konsultasi')->limit(100)->get()->reverse()->values();

        return response()->json(['data' => $messages]);
    }

    public function send(Request $request, int $id): JsonResponse
    {
        $this->authorizeThread($request, $id);
        $data = $request->validate(['isi_pesan' => 'required|string|max:4000']);
        $user = $request->user('sanctum');
        $sender = $user?->role === 'admin' ? 'admin' : 'pelanggan';
        DB::table('konsultasi')->insert(array_merge($data, ['id_pelanggan' => $id, 'id_user' => $user?->id_user, 'pengirim' => $sender, 'waktu_kirim' => now(), 'created_at' => now(), 'updated_at' => now()]));

        return response()->json(['message' => 'Pesan terkirim.'], 201);
    }

    public function threads(): JsonResponse
    {
        $latest = DB::table('konsultasi')->selectRaw('id_pelanggan, MAX(id_konsultasi) as latest_id')->groupBy('id_pelanggan');
        $threads = DB::table('pelanggan')->joinSub($latest, 'latest', 'pelanggan.id_pelanggan', '=', 'latest.id_pelanggan')
            ->join('konsultasi', 'konsultasi.id_konsultasi', '=', 'latest.latest_id')->orderByDesc('latest.latest_id')
            ->paginate(20, ['pelanggan.id_pelanggan', 'pelanggan.nama', 'konsultasi.isi_pesan', 'konsultasi.waktu_kirim', 'konsultasi.pengirim']);

        return response()->json(['data' => $threads]);
    }
}

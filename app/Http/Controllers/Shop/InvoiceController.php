<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    /**
     * Route-model-binding ile (ör: /account/orders/{order}/invoice)
     */
    public function download(Order $order)
    {
        $order->loadMissing(['items']);

        $this->authorize('view', $order);

        $pdf = Pdf::loadView('invoices.order', [
            'order' => $order,
        ])->setPaper('a4');

        return $pdf->download($this->fileName($order));
    }

    /**
     * Public id ile (ör: /invoices/{publicId}.pdf veya /orders/{publicId}/invoice)
     * Mevcut projende success route'ta kullandığın publicId yaklaşımına uyumlu.
     */
    public function downloadByPublicId(Request $request, string $publicId)
    {
        $order = Order::query()
            ->where('public_id', $publicId)
            ->first();

        // Fallback: eğer projende public_id yerine doğrudan id ile çalışıyorsan
        if (! $order && ctype_digit($publicId)) {
            $order = Order::query()->find($publicId);
        }

        abort_unless($order, 404);

        $order->loadMissing(['items']);

        $this->authorize('view', $order);

        $pdf = Pdf::loadView('invoices.order', [
            'order' => $order,
        ])->setPaper('a4');

        return $pdf->download($this->fileName($order));
    }

    private function fileName(Order $order): string
    {
        $key = $order->public_id ?? $order->id ?? 'order';

        return "invoice-{$key}.pdf";
    }
}

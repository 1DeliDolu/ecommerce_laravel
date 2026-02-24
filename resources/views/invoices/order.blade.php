<!doctype html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <title>Fatura</title>

    <style>
        @page { margin: 24px; }
        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 12px;
            color: #111827;
        }
        .muted { color: #6b7280; }
        .row { width: 100%; }
        .col { display: inline-block; vertical-align: top; }
        .col-6 { width: 49%; }
        .h1 { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
        .h2 { font-size: 13px; font-weight: 700; margin: 0 0 6px; }
        .card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
        }
        .mt-12 { margin-top: 12px; }
        .mt-16 { margin-top: 16px; }
        .mt-24 { margin-top: 24px; }
        .right { text-align: right; }
        .divider { height: 1px; background: #e5e7eb; margin: 12px 0; }

        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        th { text-align: left; font-weight: 700; background: #f9fafb; }
        tfoot td { border-bottom: none; }

        .totals td { padding: 6px 8px; }
        .totals .label { color: #374151; }
        .totals .value { text-align: right; font-weight: 700; }
        .grand { font-size: 13px; }
        .footer {
            position: fixed;
            bottom: 18px;
            left: 24px;
            right: 24px;
            font-size: 10px;
            color: #6b7280;
        }
    </style>
</head>
<body>
@php
    $orderNo = $order->public_id ?? $order->publicId ?? $order->id ?? '—';
    $created = $order->created_at ?? null;

    $currencySymbol = '€';

    $items = $order->items ?? collect();
    if (!($items instanceof \Illuminate\Support\Collection)) {
        $items = collect($items);
    }

    $subtotal = data_get($order, 'subtotal', null);
    $shipping = data_get($order, 'shipping', null);
    $tax      = data_get($order, 'tax', null);
    $total    = data_get($order, 'total', null);

    // Eğer total yoksa, satırlardan türetmeye çalış
    if ($total === null) {
        $total = $items->sum(function ($item) {
            $line = data_get($item, 'line_total', null);
            if ($line !== null) return (float) $line;

            $qty  = (int) data_get($item, 'quantity', data_get($item, 'qty', 1));
            $unit = (float) data_get($item, 'unit_price', data_get($item, 'price', 0));
            return $qty * $unit;
        });
    }

    if ($subtotal === null) $subtotal = $total;
    if ($shipping === null) $shipping = 0;
    if ($tax === null) $tax = 0;

    $formatMoney = function ($value) use ($currencySymbol) {
        $n = (float) $value;
        return number_format($n, 2, ',', '.') . " " . $currencySymbol;
    };
@endphp

<div class="row">
    <div class="col col-6">
        <div class="h1">Fatura</div>
        <div class="muted">Fatura No: <strong>INV-{{ $orderNo }}</strong></div>
        <div class="muted">
            Tarih:
            <strong>
                @if($created instanceof \Illuminate\Support\Carbon)
                    {{ $created->format('d.m.Y H:i') }}
                @else
                    {{ (string) $created }}
                @endif
            </strong>
        </div>
    </div>

    <div class="col col-6 right">
        <div class="h2">Satıcı</div>
        <div><strong>{{ config('app.name') }}</strong></div>
        <div class="muted">Bu belge sistem tarafından oluşturulmuştur.</div>
    </div>
</div>

<div class="divider"></div>

<div class="row mt-12">
    <div class="col col-6">
        <div class="card">
            <div class="h2">Müşteri</div>
            <div><strong>{{ $order->name ?? $order->customer_name ?? '—' }}</strong></div>
            <div class="muted">{{ $order->email ?? $order->customer_email ?? '—' }}</div>
            @if(!empty($order->phone ?? $order->customer_phone ?? null))
                <div class="muted">{{ $order->phone ?? $order->customer_phone }}</div>
            @endif
        </div>
    </div>

    <div class="col col-6">
        <div class="card">
            <div class="h2">Adres</div>
            <div>{{ $order->address_line1 ?? $order->address ?? '—' }}</div>
            @if(!empty($order->address_line2 ?? null))
                <div>{{ $order->address_line2 }}</div>
            @endif
            <div class="muted">
                {{ $order->city ?? '' }}
                @if(!empty($order->postal_code ?? $order->zip ?? null))
                    {{ ' · ' . ($order->postal_code ?? $order->zip) }}
                @endif
                @if(!empty($order->country ?? null))
                    {{ ' · ' . $order->country }}
                @endif
            </div>
        </div>
    </div>
</div>

<div class="mt-16">
    <table>
        <thead>
            <tr>
                <th>Ürün</th>
                <th class="right">Birim</th>
                <th class="right">Adet</th>
                <th class="right">Toplam</th>
            </tr>
        </thead>
        <tbody>
        @forelse($items as $item)
            @php
                $name = data_get($item, 'product_name')
                    ?? data_get($item, 'name')
                    ?? (data_get($item, 'product.name') ?? 'Ürün');

                $qty  = (int) (data_get($item, 'quantity', data_get($item, 'qty', 1)));
                $unit = (float) (data_get($item, 'unit_price', data_get($item, 'price', 0)));

                $line = data_get($item, 'line_total', null);
                $lineTotal = $line !== null ? (float) $line : ($qty * $unit);
            @endphp
            <tr>
                <td>
                    <div><strong>{{ $name }}</strong></div>
                    @if(!empty(data_get($item, 'sku')))
                        <div class="muted">SKU: {{ data_get($item, 'sku') }}</div>
                    @endif
                </td>
                <td class="right">{{ $formatMoney($unit) }}</td>
                <td class="right">{{ $qty }}</td>
                <td class="right">{{ $formatMoney($lineTotal) }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="4" class="muted">Sipariş kalemi bulunamadı.</td>
            </tr>
        @endforelse
        </tbody>
    </table>
</div>

<div class="row mt-16">
    <div class="col col-6"></div>
    <div class="col col-6">
        <table class="totals">
            <tbody>
                <tr>
                    <td class="label">Ara Toplam</td>
                    <td class="value">{{ $formatMoney($subtotal) }}</td>
                </tr>
                <tr>
                    <td class="label">Kargo</td>
                    <td class="value">{{ $formatMoney($shipping) }}</td>
                </tr>
                <tr>
                    <td class="label">Vergi</td>
                    <td class="value">{{ $formatMoney($tax) }}</td>
                </tr>
                <tr>
                    <td class="label grand"><strong>Genel Toplam</strong></td>
                    <td class="value grand"><strong>{{ $formatMoney($total) }}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<div class="footer">
    {{ config('app.name') }} · INV-{{ $orderNo }} · Bu fatura örneği ilk iterasyon içindir.
</div>

</body>
</html>
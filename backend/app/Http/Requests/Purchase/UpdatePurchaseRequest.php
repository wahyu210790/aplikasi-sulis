<?php

namespace App\Http\Requests\Purchase;

/** Same body as creating a purchase. Only drafts can be changed (checked in the controller). */
class UpdatePurchaseRequest extends StorePurchaseRequest {}

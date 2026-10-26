<?php

namespace App\Support;

/** Fixed list of audit actions (docs/desain-v2.md B8). Do not invent other action strings. */
final class AuditAction
{
    public const AUTH_LOGIN = 'auth.login';

    public const AUTH_LOGIN_FAILED = 'auth.login_failed';

    public const AUTH_LOGOUT = 'auth.logout';

    public const AUTH_PASSWORD_CHANGED = 'auth.password_changed';

    public const USER_CREATED = 'user.created';

    public const USER_UPDATED = 'user.updated';

    public const USER_PASSWORD_RESET = 'user.password_reset';

    public const USER_DEACTIVATED = 'user.deactivated';

    public const USER_ACTIVATED = 'user.activated';

    public const CATEGORY_CREATED = 'category.created';

    public const CATEGORY_UPDATED = 'category.updated';

    public const UNIT_CREATED = 'unit.created';

    public const UNIT_UPDATED = 'unit.updated';

    public const PRODUCT_CREATED = 'product.created';

    public const PRODUCT_UPDATED = 'product.updated';

    public const PRODUCT_IMPORTED = 'product.imported';

    public const SUPPLIER_CREATED = 'supplier.created';

    public const SUPPLIER_UPDATED = 'supplier.updated';

    public const PROJECT_CREATED = 'project.created';

    public const PROJECT_UPDATED = 'project.updated';

    public const PROJECT_STATUS_CHANGED = 'project.status_changed';

    public const PROJECT_COST_CREATED = 'project_cost.created';

    public const PROJECT_COST_UPDATED = 'project_cost.updated';

    public const PROJECT_COST_DELETED = 'project_cost.deleted';

    public const PURCHASE_CREATED = 'purchase.created';

    public const PURCHASE_UPDATED = 'purchase.updated';

    public const PURCHASE_DELETED = 'purchase.deleted';

    public const PURCHASE_RECEIVED = 'purchase.received';

    public const PURCHASE_CANCELLED = 'purchase.cancelled';

    public const OPENING_STOCK_CREATED = 'opening_stock.created';

    public const OPENING_STOCK_IMPORTED = 'opening_stock.imported';

    public const STOCK_OUT_CREATED = 'stock_out.created';

    public const STOCK_RETURN_CREATED = 'stock_return.created';

    public const STOCK_TRANSACTION_REVERSED = 'stock_transaction.reversed';

    public const OPNAME_CREATED = 'opname.created';

    public const OPNAME_UPDATED = 'opname.updated';

    public const OPNAME_SUBMITTED = 'opname.submitted';

    public const OPNAME_REJECTED = 'opname.rejected';

    public const OPNAME_POSTED = 'opname.posted';

    public const OPNAME_CANCELLED = 'opname.cancelled';

    /** @return list<string> */
    public static function all(): array
    {
        return array_values((new \ReflectionClass(self::class))->getConstants());
    }
}

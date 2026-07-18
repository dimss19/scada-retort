<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $req = Illuminate\Http\Request::create('/recipes/scan-all', 'POST', ['tn_id' => 2]);
    $req->setUserResolver(function() {
        return App\Models\User::first();
    });
    $res = app(\App\Http\Controllers\TnRecipeController::class)->scanAllPatterns($req);
    echo $res->getContent();
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}

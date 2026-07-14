<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('retort.{machineCode}', function ($user, $machineCode) {
    return $user !== null; // Allow any authenticated user
});

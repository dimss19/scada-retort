<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeviceStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $machineCode;
    public $isOnline;
    public $lastSeenAt;

    public function __construct(string $machineCode, bool $isOnline, ?string $lastSeenAt = null)
    {
        $this->machineCode = $machineCode;
        $this->isOnline = $isOnline;
        $this->lastSeenAt = $lastSeenAt;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('retort.'.$this->machineCode),
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreDeviceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'machine_code' => ['required', 'string', 'alpha_dash', 'max:20', 'unique:devices,machine_code'],
            'name' => ['required', 'string', 'max:255'],
            'mqtt_broker' => ['required', 'string', 'max:255'],
            'mqtt_port' => ['required', 'integer', 'min:1', 'max:65535'],
        ];
    }
}

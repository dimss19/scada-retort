<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class DeployOtaRequest extends FormRequest
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
            'device_id' => ['required', 'exists:devices,id'],
            'firmware_file_id' => ['required', 'exists:firmware_files,id'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $deviceId = $this->input('device_id');
            
            // Rule 7: Satu OTA per device
            if ($deviceId) {
                $activeDeployments = \App\Models\OtaDeployment::where('device_id', $deviceId)
                    ->whereIn('status', ['pending', 'downloading', 'flashing'])
                    ->exists();

                if ($activeDeployments) {
                    $validator->errors()->add('device_id', 'Device ini sedang dalam proses OTA. Tunggu proses selesai sebelum deploy OTA baru.');
                }
            }
        });
    }
}

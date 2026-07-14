<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePinConfigRequest extends FormRequest
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
            'configs' => ['required', 'array'],
            'configs.*.function' => ['required', 'string'],
            'configs.*.gpio_pin' => ['required', 'integer', 'min:0', 'max:48'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $configs = $this->input('configs', []);
            $seenPins = [];
            
            // Reserved pins mapping based on PRD (SD: 10-13, RTC: 8-9)
            $reservedPins = [
                8 => 'RTC_SDA',
                9 => 'RTC_SCL',
                10 => 'SD_CS',
                11 => 'SD_MOSI',
                12 => 'SD_MISO',
                13 => 'SD_CLK',
            ];

            foreach ($configs as $index => $config) {
                $pin = $config['gpio_pin'] ?? null;
                $function = $config['function'] ?? null;

                if ($pin !== null) {
                    // Check for duplicate pins in the request (Rule 1)
                    if (in_array($pin, $seenPins)) {
                        $validator->errors()->add("configs.{$index}.gpio_pin", "Pin {$pin} sudah digunakan fungsi lain.");
                    }
                    $seenPins[] = $pin;

                    // Check for reserved pins re-assignment (Edge Case 4.2.5)
                    if (isset($reservedPins[$pin]) && $function !== $reservedPins[$pin]) {
                        $validator->errors()->add("configs.{$index}.gpio_pin", "Pin {$pin} adalah pin reserved untuk {$reservedPins[$pin]}.");
                    }
                }
            }
        });
    }
}

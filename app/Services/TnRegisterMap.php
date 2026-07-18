<?php

namespace App\Services;

class TnRegisterMap
{
    public static array $modelFeatures = [
        'TNS' => ['max_alarm' => 2, 'max_di' => 2, 'has_ct' => false, 'has_3rd_display' => false],
        'TNH' => ['max_alarm' => 4, 'max_di' => 4, 'has_ct' => true, 'ct_count' => 1, 'has_3rd_display' => true],
        'TNL' => ['max_alarm' => 6, 'max_di' => 6, 'has_ct' => true, 'ct_count' => 2, 'has_3rd_display' => true],
    ];

    public static array $monitoringRegisters = [
        ['address' => 301001, 'offset' => 1000, 'name' => 'pv', 'label' => 'Present Value'],
        ['address' => 301002, 'offset' => 1001, 'name' => 'decimal_point', 'label' => 'Decimal Point'],
        ['address' => 301003, 'offset' => 1002, 'name' => 'display_unit', 'label' => 'Display Unit'],
        ['address' => 301004, 'offset' => 1003, 'name' => 'sv', 'label' => 'Set Value'],
        ['address' => 301005, 'offset' => 1004, 'name' => 'heating_mv', 'label' => 'Heating MV'],
        ['address' => 301006, 'offset' => 1005, 'name' => 'cooling_mv', 'label' => 'Cooling MV'],
        // status flags are at 301008
        ['address' => 301008, 'offset' => 1007, 'name' => 'status_flag', 'label' => 'Status Flag'],
        // alarms are at 301012
        ['address' => 301012, 'offset' => 1011, 'name' => 'alarm_status', 'label' => 'Alarm Status'],
        // events at 301011
        ['address' => 301011, 'offset' => 1010, 'name' => 'event_status', 'label' => 'Event Status'],
        // ct1 and ct2 at 301013 and 301014
        ['address' => 301013, 'offset' => 1012, 'name' => 'ct1_current', 'label' => 'CT1 Current'],
        ['address' => 301014, 'offset' => 1013, 'name' => 'ct2_current', 'label' => 'CT2 Current'],
        ['address' => 301020, 'offset' => 1019, 'name' => 'pattern_current', 'label' => 'Current Pattern'],
        ['address' => 301021, 'offset' => 1020, 'name' => 'step_current', 'label' => 'Current Step'],
        ['address' => 301022, 'offset' => 1021, 'name' => 'process_time', 'label' => 'Process Time'],
        ['address' => 301024, 'offset' => 1023, 'name' => 'rest_time', 'label' => 'Rest Time'],
    ];

    public static array $holdingGroups = [
        'operation' => [
            ['address' => 400001, 'offset' => 0, 'name' => 'run_stop', 'label' => 'RUN/STOP', 'min' => 0, 'max' => 1, 'default' => 1, 'options' => [0 => 'RUN', 1 => 'STOP']],
            ['address' => 400002, 'offset' => 1, 'name' => 'auto_tuning', 'label' => 'Auto-Tuning', 'min' => 0, 'max' => 2, 'default' => 0, 'options' => [0 => 'OFF', 1 => 'AT1', 2 => 'AT2']],
            ['address' => 400003, 'offset' => 2, 'name' => 'auto_manual', 'label' => 'Auto/Manual', 'min' => 0, 'max' => 1, 'default' => 0, 'options' => [0 => 'AUTO', 1 => 'MANUAL']],
            ['address' => 400004, 'offset' => 3, 'name' => 'manual_mv', 'label' => 'Manual MV', 'min' => -1000, 'max' => 1000, 'default' => 0],
            ['address' => 400005, 'offset' => 4, 'name' => 'manual_cooling_mv', 'label' => 'Manual Cooling MV', 'min' => 0, 'max' => 1000, 'default' => 0],
            ['address' => 400006, 'offset' => 5, 'name' => 'set_value', 'label' => 'Target SV', 'min' => -1999, 'max' => 9999, 'default' => 0],
            ['address' => 400007, 'offset' => 6, 'name' => 'operation_mode', 'label' => 'Operation Mode', 'min' => 0, 'max' => 1, 'default' => 0, 'options' => [0 => 'FIX', 1 => 'PROG']],
            ['address' => 400008, 'offset' => 7, 'name' => 'control_mode', 'label' => '2-DOF Mode', 'min' => 0, 'max' => 2, 'default' => 0, 'options' => [0 => 'PID.S', 1 => 'PID.F', 2 => 'PID.M']],
        ],
        'pattern' => [
            ['address' => 400201, 'offset' => 200, 'name' => 'time_unit', 'label' => 'Time Unit', 'options' => [0 => 'MM.SS', 1 => 'HH.MM']],
            ['address' => 400202, 'offset' => 201, 'name' => 'start_condition', 'label' => 'Start Condition', 'options' => [0 => 'SSV', 1 => 'SPV']],
            ['address' => 400203, 'offset' => 202, 'name' => 'wait_width', 'label' => 'Wait Width', 'min' => 0, 'max' => 999],
            ['address' => 400204, 'offset' => 203, 'name' => 'wait_time', 'label' => 'Wait Time', 'min' => 0, 'max' => 9960],
            ['address' => 400205, 'offset' => 204, 'name' => 'pattern_number', 'label' => 'Pattern Number', 'min' => 0, 'max' => 9],
            ['address' => 400206, 'offset' => 205, 'name' => 'repetitions', 'label' => 'Repetitions', 'min' => 0, 'max' => 10000],
            ['address' => 400207, 'offset' => 206, 'name' => 'end_state', 'label' => 'End State', 'options' => [0 => 'STOP', 1 => 'HOLD', 2 => 'NEXT', 3 => 'PRE']],
            ['address' => 400208, 'offset' => 207, 'name' => 'pid_select', 'label' => 'PID Select', 'min' => 0, 'max' => 7],
            ['address' => 400209, 'offset' => 208, 'name' => 'step_quantity', 'label' => 'Step Quantity', 'min' => 0, 'max' => 20],
        ],
        // Additional groups can be added here as needed for config sync
    ];

    public static function decodeStatusFlag($value)
    {
        return [
            'run_status' => (bool)($value & (1 << 0)), // 0: RUN, 1: STOP
            'auto_manual' => (bool)($value & (1 << 1)), // 0: AUTO, 1: MANUAL
            'out1_active' => (bool)($value & (1 << 2)),
            'out2_active' => (bool)($value & (1 << 3)),
            'at_running' => (bool)($value & (1 << 4)),
            // other bits based on Appendix...
        ];
    }
}

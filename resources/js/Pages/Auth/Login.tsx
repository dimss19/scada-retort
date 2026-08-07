import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="mb-8 text-center">
                <h2 className="text-2xl font-black text-slate-900 mb-1.5">Welcome Back</h2>
                <p className="text-sm font-semibold text-slate-500">Sign in to your SCADA dashboard</p>
            </div>

            {status && (
                <div className="mb-6 text-sm font-bold text-emerald-800 bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <InputLabel htmlFor="email" value="Email" className="text-slate-700 font-bold text-sm" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1.5 block w-full rounded-xl border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-600 focus:ring-blue-600 font-medium py-3 px-4"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Password" className="text-slate-700 font-bold text-sm" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1.5 block w-full rounded-xl border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-600 focus:ring-blue-600 font-medium py-3 px-4"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center cursor-pointer">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            onChange={(e) =>
                                setData(
                                    'remember',
                                    (e.target.checked || false) as false,
                                )
                            }
                        />
                        <span className="ms-2 text-sm font-semibold text-slate-600">
                            Remember me
                        </span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>

                <div className="pt-3">
                    <PrimaryButton className="w-full justify-center py-3.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm rounded-xl shadow-md hover:from-yellow-300 hover:to-amber-400 border-none transition-all" disabled={processing}>
                        LOG IN
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}

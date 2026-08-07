import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="mb-8 text-center">
                <h2 className="text-2xl font-black text-slate-900 mb-1.5">Create Account</h2>
                <p className="text-sm font-semibold text-slate-500">Sign up to access SCADA control dashboard</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="name" value="Name" className="text-slate-700 font-bold text-sm" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1.5 block w-full rounded-xl border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-600 focus:ring-blue-600 font-medium py-3 px-4"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" className="text-slate-700 font-bold text-sm" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1.5 block w-full rounded-xl border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-600 focus:ring-blue-600 font-medium py-3 px-4"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
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
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                        className="text-slate-700 font-bold text-sm"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1.5 block w-full rounded-xl border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-600 focus:ring-blue-600 font-medium py-3 px-4"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="pt-2 flex items-center justify-between">
                    <Link
                        href={route('login')}
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        Already registered?
                    </Link>

                    <PrimaryButton className="py-3 px-6 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm rounded-xl shadow-md hover:from-yellow-300 hover:to-amber-400 border-none transition-all" disabled={processing}>
                        REGISTER
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}

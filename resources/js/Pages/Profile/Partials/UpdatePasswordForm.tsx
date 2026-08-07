import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';

export default function UpdatePasswordForm({
    className = '',
}: {
    className?: string;
}) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header className="border-b border-slate-200 pb-4 mb-6">
                <h2 className="text-xl font-black text-slate-900">
                    Ubah Kata Sandi
                </h2>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                    Pastikan akun Anda menggunakan kata sandi yang kuat dan aman untuk menjaga keamanan sistem.
                </p>
            </header>

            <form onSubmit={updatePassword} className="space-y-5">
                <div>
                    <label htmlFor="current_password" className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Kata Sandi Saat Ini</label>

                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) =>
                            setData('current_password', e.target.value)
                        }
                        type="password"
                        className="block w-full"
                        autoComplete="current-password"
                    />

                    <InputError
                        message={errors.current_password}
                        className="mt-2 text-xs font-bold text-rose-600"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Kata Sandi Baru</label>

                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className="block w-full"
                        autoComplete="new-password"
                    />

                    <InputError message={errors.password} className="mt-2 text-xs font-bold text-rose-600" />
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Konfirmasi Kata Sandi Baru</label>

                    <TextInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        type="password"
                        className="block w-full"
                        autoComplete="new-password"
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2 text-xs font-bold text-rose-600"
                    />
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <PrimaryButton disabled={processing}>Simpan Kata Sandi</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-xs font-bold text-emerald-700">
                            Tersimpan.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AuthenticatedLayout
            header={
                <div className="max-w-7xl mx-auto py-1">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Pengaturan Profil Pengguna</h1>
                    <p className="text-sm font-semibold text-slate-600 mt-0.5">Kelola informasi akun, kata sandi, dan keamanan sistem SCADA Retort.</p>
                </div>
            }
        >
            <Head title="Profil Akun" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-7 backdrop-blur-xl">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-7 backdrop-blur-xl">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-7 backdrop-blur-xl">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

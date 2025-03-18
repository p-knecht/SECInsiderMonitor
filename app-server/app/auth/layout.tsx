import Image from 'next/image';

/**
 *  Defines general layout for the authentication (public) pages of the application
 *
 * @param {React.ReactNode} children - The embedded children of the layout
 * @returns {React.ReactNode} - The layout of the authentication/public pages of the application
 */
const AuthLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-7">
        <span className="flex items-center gap-3 self-center font-medium" tabIndex={-1}>
          <Image src="/logo_192.png" alt="Logo" width={48} height={48} />
          <h1 className="text-3xl font-semibold text-gray-600 drop-shadow-md pb-1">
            SECInsiderMonitor
          </h1>
        </span>
        <div className="flex flex-col gap-6">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;

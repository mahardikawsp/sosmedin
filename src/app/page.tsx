export default function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="flex flex-col items-center justify-center rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
                <h1 className="mb-4 text-4xl font-bold text-primary-600">Sosmedin</h1>
                <p className="mb-8 text-center text-gray-600 dark:text-gray-300">
                    A modern social media platform
                </p>
                <div className="flex gap-4">
                    <button className="rounded bg-primary-600 px-4 py-2 font-bold text-white hover:bg-primary-700">
                        Sign Up
                    </button>
                    <button className="rounded border border-primary-600 px-4 py-2 font-bold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900">
                        Log In
                    </button>
                </div>
            </div>
        </div>
    );
}
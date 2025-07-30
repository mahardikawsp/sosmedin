/**
 * Utility to fix localhost redirects in production
 */

const PRODUCTION_DOMAIN = 'https://avvhvzvndubd.ap-southeast-1.clawcloudrun.com';

/**
 * Replaces any localhost URLs with the production domain
 * @param url - The URL to fix
 * @returns The corrected URL
 */
export function fixLocalhostUrl(url: string): string {
    if (!url) return url;

    // Replace localhost:3000 with production domain
    if (url.includes('localhost:3000')) {
        return url.replace(/https?:\/\/localhost:3000/g, PRODUCTION_DOMAIN);
    }

    // Replace just localhost with production domain
    if (url.includes('localhost')) {
        return url.replace(/https?:\/\/localhost/g, PRODUCTION_DOMAIN);
    }

    return url;
}

/**
 * Middleware to intercept and fix redirect responses
 */
export function interceptRedirect(response: Response): Response {
    // Check if this is a redirect response
    if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('Location');
        if (location && location.includes('localhost')) {
            const fixedLocation = fixLocalhostUrl(location);
            console.log(`Fixing redirect: ${location} -> ${fixedLocation}`);

            // Create a new response with the fixed location
            const newResponse = new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });
            newResponse.headers.set('Location', fixedLocation);
            return newResponse;
        }
    }

    return response;
}

/**
 * Fix callback URLs in login forms
 */
export function fixCallbackUrl(callbackUrl: string): string {
    if (!callbackUrl) return callbackUrl;

    // If it's a localhost URL, replace it
    if (callbackUrl.includes('localhost')) {
        return fixLocalhostUrl(callbackUrl);
    }

    // If it's a relative URL, make it absolute with production domain
    if (callbackUrl.startsWith('/')) {
        return `${PRODUCTION_DOMAIN}${callbackUrl}`;
    }

    return callbackUrl;
}
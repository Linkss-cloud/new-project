export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const channelId = url.searchParams.get("id");

    if (!channelId) {
        return new Response(JSON.stringify({ error: "Missing channel ID" }), { status: 400 });
    }

    const viewerIp = request.headers.get('CF-Connecting-IP') || 'unknown';

    const apiKey = env.API_SECRET_KEY || '';
    const workerUrl = `https://ziotv.movieszonemedia.workers.dev/api/channels?client_ip=${viewerIp}`;

    try {
        const response = await fetch(workerUrl, {
            headers: { "X-API-Key": apiKey }
        });

        if (!response.ok) {
            return new Response(JSON.stringify({ error: "Failed to authenticate with backend" }), { status: 500 });
        }

        const base64Data = await response.text();
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const iv = bytes.slice(0, 12);
        const encryptedData = bytes.slice(12);

        const encryptionKeyStr = env.ENCRYPTION_KEY || '';

        const cryptoKey = await crypto.subtle.importKey(
            "raw", new TextEncoder().encode(encryptionKeyStr),
            { name: "AES-GCM" },
            false, ["decrypt"]
        );

        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            cryptoKey,
            encryptedData
        );

        const jsonText = new TextDecoder().decode(decryptedBuffer);
        const channels = JSON.parse(jsonText);

        const secureLink = channels[channelId];

        if (!secureLink) {
            return new Response(JSON.stringify({ error: "Channel not found in directory" }), { status: 404 });
        }

        return new Response(JSON.stringify({ url: secureLink }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Decryption failed or internal error" }), { status: 500 });
    }
}

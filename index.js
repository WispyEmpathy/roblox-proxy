// Copyright (c) 2024 iiPython

// Cloudflare Workers don't support require("fs"), so everything is inline

export default {
    async fetch(request) {
        const results = [];

        const headers = new Headers();
        headers.set("user-agent", "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36");

        const init = {
            method: "GET",
            headers,
        };

        // Loop up to 50 times
        const fetches = [];
        for (let i = 0; i < 50; i++) {
            const userID = Math.floor(Math.random() * 100000000) + 1;
            const url = `https://users.roblox.com/v1/users/${userID}`;

            fetches.push(
                fetch(url, init)
                    .then(async (res) => {
                        if (res.ok) {
                            const data = await res.json();
                            // Only push if it has a valid userId (could add more filters)
                            if (data && data.id) {
                                results.push(data);
                            }
                        }
                    })
                    .catch(() => {}) // Skip errors
            );
        }

        await Promise.all(fetches);

        return new Response(JSON.stringify(results, null, 2), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    }
};

export default {
    async fetch(request) {
        const ExtraValue = {
            DefaultIncome: 5,
            VerifiedBadge: 10000,
            Groups: {
                1200769: 25000,
                7: 15,
                3959677: 15,
                4705120: 15,
                34671275: 15,
                12836673: 15,
                3049798: 15,
                12013007: 15,
                3982592: 15,
                3461453: 15,
                4372130: 15,
                2782840: 15,
                295182: 15,
                34852864: 15,
                35789249: 15,
                2703304: 15,
                3333298: 15
            },
            UserID: {
                10000000000: 10,
                1000000000: 25,
                100000000: 50,
                10000000: 100,
                5000000: 300,
                1000000: 400,
                500000: 700,
                250000: 1000,
                100000: 1250,
                25000: 1500,
                5000: 3000,
                1000: 5000,
                250: 7000,
                50: 12500
            }
        };

        const headers = new Headers();
        headers.set("user-agent", "Mozilla/5.0");
        const init = { method: "GET", headers };

        // Generate 20 low IDs and 30 full-range IDs
        const userIDs = [
            ...Array.from({ length: 20 }, () => Math.floor(Math.random() * 250000) + 1),
            ...Array.from({ length: 30 }, () => Math.floor(Math.random() * 8986292676) + 1)
        ];

        // Shuffle array (Fisher-Yates)
        for (let i = userIDs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [userIDs[i], userIDs[j]] = [userIDs[j], userIDs[i]];
        }

        // Prepare fetch promises
        const fetches = userIDs.map(userID => {
            const userUrl = `https://users.roblox.com/v1/users/${userID}`;
            const groupUrl = `https://groups.roblox.com/v2/users/${userID}/groups/roles`;

            return fetch(userUrl, init)
                .then(async res => {
                    if (!res.ok) return null;
                    const userData = await res.json();
                    if (!userData || !userData.id) return null;

                    let income = ExtraValue.DefaultIncome;

                    // UserID-based bonuses
                    for (const [uidThresholdStr, bonus] of Object.entries(ExtraValue.UserID)) {
                        const uidThreshold = parseInt(uidThresholdStr);
                        if (userID < uidThreshold) {
                            income += bonus;
                        }
                    }

                    // Verified badge bonus
                    if (userData.hasVerifiedBadge) {
                        income += ExtraValue.VerifiedBadge;
                    }

                    // Group bonuses
                    let groupData = [];
                    try {
                        const groupRes = await fetch(groupUrl, init);
                        if (groupRes.ok) {
                            const groupJson = await groupRes.json();
                            groupData = groupJson.data || [];
                        }
                    } catch (_) {}

                    for (const group of groupData) {
                        const groupId = group.group?.id;
                        if (groupId && ExtraValue.Groups[groupId]) {
                            income += ExtraValue.Groups[groupId];
                        }
                    }

                    return {
                        ...userData,
                        income,
                        groups: groupData.map(g => ({
                            id: g.group.id,
                            name: g.group.name
                        }))
                    };
                })
                .catch(() => null);
        });

        const resolved = await Promise.all(fetches);
        const validResults = resolved.filter(user => user !== null);
        return new Response(JSON.stringify(validResults, null, 2), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    }
};

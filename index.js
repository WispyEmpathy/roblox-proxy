export default {
    async fetch(request) {
        const ExtraValue = {
            DefaultIncome: 5,
            VerifiedBadge: 10000,
            Groups: {
                1200769: 25000
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
        const fetches = [];

        for (let i = 0; i < 50; i++) {
            const userID = Math.floor(Math.random() * 8986292676) + 1;
            const userUrl = `https://users.roblox.com/v1/users/${userID}`;
            const groupUrl = `https://groups.roblox.com/v2/users/${userID}/groups/roles`;

            const fetchUser = fetch(userUrl, init)
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

                    // Verified badge bonus (optional, still included for future use)
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

            fetches.push(fetchUser);
        }

        const resolved = await Promise.all(fetches);
        const validResults = resolved.filter(user => user !== null);
        return new Response(JSON.stringify(validResults, null, 2), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    }
};

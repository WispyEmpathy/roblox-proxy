export default {
    async fetch(request) {
        const results = [];

        const ExtraValue = {
            DefaultIncome: 5,
            VerifiedBadge: 10000,
            Groups: {
                1200769: 25000
            },
            UserID: {
                1000000: 50,
                500000: 100,
                250000: 500,
                100000: 1000,
                25000: 1500,
                5000: 2500,
                1000: 3000,
                250: 5000,
                50: 10000
            }
        };

        const headers = new Headers();
        headers.set("user-agent", "Mozilla/5.0");

        const init = {
            method: "GET",
            headers,
        };

        const fetches = [];
        for (let i = 0; i < 50; i++) {
            const userID = Math.floor(Math.random() * 100000000) + 1;
            const userUrl = `https://users.roblox.com/v1/users/${userID}`;
            const groupUrl = `https://groups.roblox.com/v2/users/${userID}/groups/roles`;

            const fetchUser = fetch(userUrl, init)
                .then(async res => {
                    if (!res.ok) return null;
                    const userData = await res.json();
                    if (!userData || !userData.id) return null;

                    let income = ExtraValue.DefaultIncome;

                    // Apply UserID-based bonuses
                    for (const [uidThresholdStr, bonus] of Object.entries(ExtraValue.UserID)) {
                        const uidThreshold = parseInt(uidThresholdStr);
                        if (userID < uidThreshold) {
                            income += bonus;
                        }
                    }

                    // Apply Verified Badge bonus
                    if (userData.hasVerifiedBadge) {
                        income += ExtraValue.VerifiedBadge;
                    }

                    // Fetch group data
                    let groupData = [];
                    try {
                        const groupRes = await fetch(groupUrl, init);
                        if (groupRes.ok) {
                            const groupJson = await groupRes.json();
                            groupData = groupJson.data || [];
                        }
                    } catch (_) {}

                    // Apply Group-based bonuses
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

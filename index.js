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

        function getBadgeIncome(badgeCount) {
            const table = [
                { count: 15, income: 500 },
                { count: 30, income: 1000 },
                { count: 45, income: 1500 },
                { count: 60, income: 2000 },
                { count: 100, income: 3000 },
                { count: 200, income: 4000 },
                { count: 500, income: 5000 }
            ];
            if (badgeCount < 15) return 0;
            for (let i = 0; i < table.length - 1; i++) {
                const curr = table[i], next = table[i + 1];
                if (badgeCount >= curr.count && badgeCount < next.count) {
                    const ratio = (badgeCount - curr.count) / (next.count - curr.count);
                    return curr.income + Math.floor(ratio * (next.income - curr.income));
                }
            }
            return 5000;
        }

        const headers = new Headers();
        headers.set("user-agent", "Mozilla/5.0");

        const init = { method: "GET", headers };
        const fetches = [];

        for (let i = 0; i < 50; i++) {
            const userID = Math.floor(Math.random() * 8986292676) + 1;
            const userUrl = `https://users.roblox.com/v1/users/${userID}`;
            const groupUrl = `https://groups.roblox.com/v2/users/${userID}/groups/roles`;
            const badgeUrl = `https://badges.roblox.com/v1/users/${userID}/badges?limit=1&sortOrder=Asc`;

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

                    // Badge bonus
                    let badgeCount = 0;
                    try {
                        const badgeRes = await fetch(badgeUrl, init);
                        if (badgeRes.ok) {
                            const badgeTotal = badgeRes.headers.get("roblox-total-result-count");
                            if (badgeTotal) badgeCount = parseInt(badgeTotal);
                        }
                    } catch (_) {}

                    income += getBadgeIncome(badgeCount);

                    return {
                        ...userData,
                        income,
                        badgeCount,
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

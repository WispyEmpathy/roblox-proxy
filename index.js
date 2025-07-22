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

        const MIN_ACCOUNT_AGE_DAYS = 90;
        const MIN_FOLLOWERS = 5;
        const MAX_ATTEMPTS = 150;
        const TARGET_VALID_USERS = 50;

        const results = [];
        const tasks = [];

        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            const userID = Math.floor(Math.random() * 8986292676) + 1;

            tasks.push((async () => {
                try {
                    const userRes = await fetch(`https://users.roblox.com/v1/users/${userID}`, init);
                    if (!userRes.ok) return null;

                    const userData = await userRes.json();
                    if (!userData || !userData.id || !userData.created) return null;

                    const createdDate = new Date(userData.created);
                    const ageInDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (ageInDays < MIN_ACCOUNT_AGE_DAYS) return null;

                    const followerRes = await fetch(`https://friends.roblox.com/v1/users/${userID}/followers/count`, init);
                    if (!followerRes.ok) return null;

                    const followerData = await followerRes.json();
                    if (!followerData || followerData.count < MIN_FOLLOWERS) return null;

                    let income = ExtraValue.DefaultIncome;
                    for (const [uidThresholdStr, bonus] of Object.entries(ExtraValue.UserID)) {
                        const uidThreshold = parseInt(uidThresholdStr);
                        if (userID < uidThreshold) {
                            income += bonus;
                        }
                    }

                    if (userData.hasVerifiedBadge) {
                        income += ExtraValue.VerifiedBadge;
                    }

                    // Only now fetch group info
                    const groupRes = await fetch(`https://groups.roblox.com/v2/users/${userID}/groups/roles`, init);
                    let groupData = [];
                    if (groupRes.ok) {
                        const groupJson = await groupRes.json();
                        groupData = groupJson.data || [];
                        for (const group of groupData) {
                            const groupId = group.group?.id;
                            if (groupId && ExtraValue.Groups[groupId]) {
                                income += ExtraValue.Groups[groupId];
                            }
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

                } catch {
                    return null;
                }
            })());
        }

        const allResolved = await Promise.all(tasks);
        const validUsers = allResolved.filter(Boolean).slice(0, TARGET_VALID_USERS);

        return new Response(JSON.stringify(validUsers, null, 2), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    }
};

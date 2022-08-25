import { getConnection } from "../db";

interface TeamMember {
    id: number;
    email: string;
}

export default class Teams {
    static async listMembers(teamId: string): Promise<TeamMember[]> {
        const result = await getConnection().execute(`SELECT
        user.id,
        user.email
    FROM user_to_team 
    INNER JOIN user ON(user.id = user_to_team.user_id)
    WHERE user_to_team.team_id = ?`, [teamId]);

        return result.rows as TeamMember[];
    }

    static async addMember(teamId: string, email: string): Promise<void> {
        const member = await getConnection().execute(`SELECT id FROM user WHERE email = ?`, [email]);

        if (member.rows.length === 0) {
            return;
        }

        await getConnection().execute(`INSERT INTO user_to_team (team_id, user_id) VALUES(?, ?)`, [teamId, member.rows[0].id]);
    }

    static async removeMember(teamId: string, userId: string): Promise<void> {
        await getConnection().execute(`DELETE FROM user_to_team WHERE team_id = ? AND user_id = ?`, [teamId, userId]);
    }

    static async deleteTeam(teamId: string): Promise<void> {
        const shops = await getConnection().execute(`SELECT id FROM shop WHERE team_id = ?`, [teamId]);

        const shopIds = shops.rows.map(shop => shop.id);

        await getConnection().execute(`DELETE FROM shop WHERE team_id = ?`, [teamId]);
        await getConnection().execute(`DELETE FROM shop_scrape_info WHERE shop_id IN (?)`, [shopIds]);

        for (const shop of shops.rows) {

            await getConnection().execute(`DELETE FROM shop_to_user WHERE shop_id = ?`, [shop.id]);
        }

        await getConnection().execute(`DELETE FROM team WHERE id = ?`, [teamId]);
        await getConnection().execute(`DELETE FROM user_to_team WHERE team_id = ?`, [teamId]);
    }
}
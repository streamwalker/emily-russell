import Foundation

enum AppRole: String, Codable, Sendable { case admin, moderator, user }

struct UserRole: Codable, Identifiable, Sendable {
    let id: UUID
    let userId: UUID
    let role: AppRole

    enum CodingKeys: String, CodingKey {
        case id, role
        case userId = "user_id"
    }
}

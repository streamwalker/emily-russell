import Foundation
import Observation
import Supabase

@MainActor
@Observable
final class SessionStore {
    var currentUser: User?
    var isAdmin: Bool = false
    var lastError: String?

    var isAuthenticated: Bool { currentUser != nil }

    private let client = SupabaseClientHolder.shared.client

    func bootstrap() async {
        do {
            let session = try await client.auth.session
            self.currentUser = session.user
            await refreshAdminStatus()
        } catch {
            self.currentUser = nil
        }
        Task { await listenForAuthChanges() }
    }

    private func listenForAuthChanges() async {
        for await (_, session) in client.auth.authStateChanges {
            self.currentUser = session?.user
            await refreshAdminStatus()
        }
    }

    private func refreshAdminStatus() async {
        guard let uid = currentUser?.id else { isAdmin = false; return }
        do {
            let roles: [UserRole] = try await client
                .from("user_roles")
                .select()
                .eq("user_id", value: uid)
                .execute()
                .value
            isAdmin = roles.contains { $0.role == .admin }
        } catch {
            isAdmin = false
        }
    }
}

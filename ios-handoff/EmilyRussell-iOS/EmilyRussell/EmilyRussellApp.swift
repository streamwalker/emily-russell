import SwiftUI
import Supabase

@main
struct EmilyRussellApp: App {
    @State private var session = SessionStore()

    var body: some Scene {
        WindowGroup {
            RootRouter()
                .environment(session)
                .task { await session.bootstrap() }
                .tint(.brand.gold)
        }
    }
}

struct RootRouter: View {
    @Environment(SessionStore.self) private var session

    var body: some View {
        TabView {
            Tab("Home", systemImage: "house") {
                NavigationStack { MarketingHomeView() }
            }
            if session.isAuthenticated {
                Tab("Portal", systemImage: "key.fill") {
                    NavigationStack { PortalDashboardView() }
                }
            }
            if session.isAdmin {
                Tab("Admin", systemImage: "shield") {
                    NavigationStack { AdminDashboardView() }
                }
            }
            if session.isAuthenticated {
                Tab("Account", systemImage: "person.crop.circle") {
                    NavigationStack { AccountView() }
                }
            }
        }
    }
}

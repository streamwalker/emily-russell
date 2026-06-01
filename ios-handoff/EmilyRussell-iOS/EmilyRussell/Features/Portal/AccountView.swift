import SwiftUI

struct AccountView: View {
    @Environment(SessionStore.self) private var session
    var body: some View {
        List {
            Section("Account") {
                Text(session.currentUser?.email ?? "—")
                NavigationLink("Change email") { Text("TODO") }
                NavigationLink("Sign out") { Text("TODO") }
            }
            Section("Legal & Disclosures") {
                NavigationLink("IABS Form") { LegalDocumentView(title: "IABS", resourceName: "iabs") }
                NavigationLink("Consumer Protection Notice") { LegalDocumentView(title: "Consumer Protection", resourceName: "consumer-protection-notice") }
                NavigationLink("Fair Housing") { LegalDocumentView(title: "Fair Housing", resourceName: "fair-housing") }
                NavigationLink("Privacy Policy") { LegalDocumentView(title: "Privacy", resourceName: "privacy-policy") }
                NavigationLink("Terms of Service") { LegalDocumentView(title: "Terms", resourceName: "terms-of-service") }
            }
            Section { Text("Emily Russell · Texas Realtor · TREC License #791742 · Fathom Realty, LLC").font(.caption).foregroundStyle(.secondary) }
        }
        .navigationTitle("Account")
    }
}

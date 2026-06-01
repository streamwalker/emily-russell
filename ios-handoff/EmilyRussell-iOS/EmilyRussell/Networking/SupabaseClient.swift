import Foundation
import Supabase

@MainActor
final class SupabaseClientHolder {
    static let shared = SupabaseClientHolder()
    let client: SupabaseClient

    private init() {
        guard
            let urlString = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
            let url = URL(string: urlString),
            let key = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String
        else {
            fatalError("Missing SUPABASE_URL / SUPABASE_ANON_KEY in Info.plist (set via Config.xcconfig).")
        }
        client = SupabaseClient(
            supabaseURL: url,
            supabaseKey: key,
            options: .init(auth: .init(storage: KeychainAuthStorage()))
        )
    }
}

import { supabase } from "@/lib/supabase";
import { isAuthRetryableFetchError, type Session } from "@supabase/supabase-js";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// Who is logged in, backed by Supabase Auth.
// The functions return an error message to show the user, or null if it worked.
// `Promise<...>` means the function talks to the internet and finishes later (use `await`).
type AuthStore = {
  isLoggedIn: boolean;
  isLoading: boolean;
  userId: string | null; // the logged-in user's Supabase id, or null when logged out
  name: string; // the full name from sign-up ("" if none, e.g. older accounts)
  email: string; // the logged-in user's email ("" when logged out)
  logIn: (email: string, password: string) => Promise<string | null>;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
};

// Shown when someone signs up with an email that already has an account.
export const DUPLICATE_EMAIL_MESSAGE =
  "An account with this email already exists. Would you like to log in with this email?";

// Shown when sign-up fails because of the connection or a Supabase service problem.
const REGISTRATION_FAILED_MESSAGE =
  "We couldn’t complete registration. Please try again.";

// Shown when the email isn't registered or the password is wrong (Supabase doesn't say which).
const WRONG_CREDENTIALS_MESSAGE =
  "The email or password is incorrect. Please try again.";

// Shown when login fails because of the connection or a Supabase service problem.
const LOGIN_FAILED_MESSAGE = "We couldn’t log you in. Please try again.";

const AuthContext = createContext<AuthStore | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Hooks like useState must live inside the component.
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Load a login saved from last time (AsyncStorage keeps it).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    // 2. Update `session` whenever the user logs in or out, so screens never set it themselves.
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    // 3. Stop listening if this provider is ever removed.
    return () => data.subscription.unsubscribe();
  }, []);

  // Logged in = Supabase has a session.
  const isLoggedIn = session !== null;
  const userId = session?.user.id ?? null;
  // `user_metadata` is where Supabase keeps the extra info we saved at sign-up.
  const name: string = session?.user.user_metadata.name ?? "";
  const email = session?.user.email ?? "";

  async function logIn(email: string, password: string) {
    let error;
    try {
      ({ error } = await supabase.auth.signInWithPassword({ email, password }));
    } catch {
      // Something unexpected broke before Supabase could answer.
      return LOGIN_FAILED_MESSAGE;
    }

    if (error) {
      if (error.code === "invalid_credentials")
        return WRONG_CREDENTIALS_MESSAGE;
      // No connection, or Supabase itself had a problem (status 500+).
      if (isAuthRetryableFetchError(error) || (error.status ?? 0) >= 500) {
        return LOGIN_FAILED_MESSAGE;
      }
      // Anything else (e.g. email not confirmed yet) tells the user what to do.
      return error.message;
    }
    return null;
  }

  // Email confirmation is on, so this does NOT log the user in yet:
  // they have to click the link in the confirmation email first.
  async function signUp(name: string, email: string, password: string) {
    let data, error;
    try {
      // `options.data` saves the name on the account, so every screen can read it later.
      ({ data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      }));
    } catch {
      // Something unexpected broke before Supabase could answer.
      return REGISTRATION_FAILED_MESSAGE;
    }

    if (error) {
      // With confirmation off, Supabase reports a taken email as an error.
      if (error.code === "user_already_exists") return DUPLICATE_EMAIL_MESSAGE;
      // No connection, or Supabase itself had a problem (status 500+).
      if (isAuthRetryableFetchError(error) || (error.status ?? 0) >= 500) {
        return REGISTRATION_FAILED_MESSAGE;
      }
      // Anything else (e.g. password too short) tells the user what to fix.
      return error.message;
    }
    // With confirmation on, Supabase hides it (so strangers can't check who has an account)
    // and returns a user with no identities. A real new account always has one.
    if (data.user && data.user.identities?.length === 0) {
      return DUPLICATE_EMAIL_MESSAGE;
    }
    return null;
  }

  async function logOut() {
    await supabase.auth.signOut();
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return error ? error.message : null;
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        userId,
        name,
        email,
        logIn,
        signUp,
        logOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const store = useContext(AuthContext);
  if (!store) throw new Error("useAuth must be used inside AuthProvider");
  return store;
}

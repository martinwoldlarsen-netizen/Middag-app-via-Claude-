import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InstallCard } from '@/components/InstallCard';
import { Button } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { MIN_PASSWORD, useAuth } from '@/lib/auth';

type Mode = 'login' | 'signup' | 'forgot';

const TEXT: Record<Mode, { title: string; body: string; button: string }> = {
  login: { title: 'Hei igjen 👋', body: 'Logg inn for å se ukas middager og handlelista.', button: 'Logg inn' },
  signup: {
    title: 'Lag konto',
    body: 'Da har du middagene og lista på alle telefonene dine, og kan dele dem med samboer.',
    button: 'Lag konto',
  },
  forgot: { title: 'Glemt passord?', body: 'Skriv e-posten din, så sender vi en lenke for å lage nytt passord.', button: 'Send lenke' },
};

// Innlogging som i ukepenger: Google (når det er slått på), eller e-post og passord.
export function LoginScreen() {
  const auth = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<Mode | 'google' | 'resend' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const text = TEXT[mode];
  const canSubmit = email.trim().includes('@') && (mode === 'forgot' || password.length > 0) && busy === null;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
    setNeedsConfirm(false);
  }

  async function run(action: Mode | 'google' | 'resend', work: () => Promise<void>) {
    setBusy(action);
    setError(null);
    setInfo(null);
    try {
      await work();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.';
      setError(message);
      if (/bekreft e-posten/i.test(message)) setNeedsConfirm(true);
    } finally {
      setBusy(null);
    }
  }

  function submit() {
    if (!canSubmit) return;
    if (mode === 'login') run('login', () => auth.signIn(email, password));
    if (mode === 'signup')
      run('signup', async () => {
        const result = await auth.signUp(email, password, name);
        if (result === 'confirm_email') {
          setNeedsConfirm(true);
          setInfo('Kontoen er laget! Sjekk e-posten din (også søppelpost) og trykk på lenken. Kom så tilbake hit og logg inn.');
          setMode('login');
        }
      });
    if (mode === 'forgot')
      run('forgot', async () => {
        await auth.sendPasswordReset(email);
        setInfo('Sjekk e-posten din (også søppelpost) og trykk på lenken for å lage nytt passord.');
      });
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xxl }]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.column}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>H</Text>
          </View>
          <Text style={styles.brandText}>Handleklar</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            {text.title}
          </Text>
          <Text style={styles.body}>{text.body}</Text>

          {auth.googleEnabled && mode !== 'forgot' && (
            <>
              <Button
                label={busy === 'google' ? 'Åpner Google …' : 'Fortsett med Google'}
                icon="logo-google"
                variant="secondary"
                disabled={busy !== null}
                onPress={() => run('google', auth.signInWithGoogle)}
                style={styles.wide}
              />
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>eller med e-post</Text>
                <View style={styles.line} />
              </View>
            </>
          )}

          {mode === 'signup' && (
            <Field label="Navnet ditt">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="F.eks. Martin"
                placeholderTextColor={colors.muted}
                style={styles.input}
                autoComplete="given-name"
                textContentType="givenName"
                maxLength={40}
                accessibilityLabel="Navnet ditt"
              />
            </Field>
          )}
          <Field label="E-post">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="navn@epost.no"
              placeholderTextColor={colors.muted}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              inputMode="email"
              onSubmitEditing={submit}
              accessibilityLabel="E-post"
            />
          </Field>
          {mode !== 'forgot' && (
            <Field label="Passord">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={mode === 'signup' ? `Minst ${MIN_PASSWORD} tegn` : 'Passordet ditt'}
                placeholderTextColor={colors.muted}
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                onSubmitEditing={submit}
                accessibilityLabel="Passord"
              />
            </Field>
          )}

          {error && (
            <Text style={[styles.status, styles.statusError]} role="alert">
              {error}
            </Text>
          )}
          {info && (
            <Text style={[styles.status, styles.statusOk]} role="status">
              {info}
            </Text>
          )}
          {needsConfirm && (
            <Pressable
              accessibilityRole="button"
              disabled={!email.trim() || busy !== null}
              onPress={() =>
                run('resend', async () => {
                  await auth.resendConfirmation(email);
                  setInfo('Ny e-post er sendt. Sjekk innboksen og søppelpost.');
                  setNeedsConfirm(false);
                })
              }>
              <Text style={styles.link}>Fikk du ikke e-posten? Send på nytt</Text>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.button}
            disabled={!canSubmit}
            onPress={submit}
            style={[styles.submit, !canSubmit && styles.submitDisabled]}>
            {busy === mode ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.submitText}>{text.button}</Text>}
          </Pressable>

          <View style={styles.switches}>
            {mode === 'login' && (
              <>
                <Pressable accessibilityRole="button" onPress={() => switchMode('signup')}>
                  <Text style={styles.link}>Ny her? Lag konto</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => switchMode('forgot')}>
                  <Text style={styles.linkSoft}>Glemt passord?</Text>
                </Pressable>
              </>
            )}
            {mode !== 'login' && (
              <Pressable accessibilityRole="button" onPress={() => switchMode('login')}>
                <Text style={styles.link}>{mode === 'signup' ? 'Har du konto? Logg inn' : 'Tilbake til innlogging'}</Text>
              </Pressable>
            )}
          </View>
        </View>

        <InstallCard />

        <Pressable accessibilityRole="button" onPress={auth.continueWithoutAccount} style={styles.guest}>
          <Text style={styles.guestTitle}>Bruk uten konto</Text>
          <Text style={styles.guestText}>Lista og middagene lagres bare på denne telefonen.</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// Når lenken for nytt passord i e-posten er åpnet.
export function NewPasswordScreen() {
  const auth = useAuth();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await auth.setNewPassword(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xxl }]}>
      <View style={styles.column}>
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            Velg nytt passord
          </Text>
          <Text style={styles.body}>Skriv et nytt passord på minst {MIN_PASSWORD} tegn.</Text>
          <Field label="Nytt passord">
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              onSubmitEditing={save}
              accessibilityLabel="Nytt passord"
            />
          </Field>
          {error && (
            <Text style={[styles.status, styles.statusError]} role="alert">
              {error}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lagre passord"
            disabled={busy || password.length === 0}
            onPress={save}
            style={[styles.submit, (busy || password.length === 0) && styles.submitDisabled]}>
            {busy ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.submitText}>Lagre passord</Text>}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: 440,
    gap: spacing.lg,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.limeStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.ink,
  },
  brandText: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 36,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  wide: {
    alignSelf: 'stretch',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  dividerText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.muted,
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  input: {
    backgroundColor: colors.beige,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    outlineStyle: 'none',
  } as object,
  status: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  statusError: {
    backgroundColor: '#FBE9E5',
    color: colors.danger,
  },
  statusOk: {
    backgroundColor: colors.lime,
    color: colors.ink,
  },
  submit: {
    backgroundColor: colors.ink,
    borderRadius: radius.round,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitText: {
    fontFamily: fonts.monoMedium,
    fontSize: 15,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.bg,
  },
  switches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  link: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.green,
    textDecorationLine: 'underline',
  },
  linkSoft: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    textDecorationLine: 'underline',
  },
  guest: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 2,
  },
  guestTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.inkSoft,
    textDecorationLine: 'underline',
  },
  guestText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useAuth, type AccountInfo } from '@/lib/auth';
import { useMeals } from '@/lib/meals-store';

// Konto øverst under Mer: hvem du er logget inn som, hvem som er med i
// husstanden, og logg ut. Uten konto: knapp for å logge inn.
export function AccountCard() {
  const auth = useAuth();
  const { householdToken } = useMeals();
  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const signedIn = Boolean(auth.session);
  useEffect(() => {
    if (!signedIn || !householdToken) return;
    let alive = true;
    auth
      .accountInfo()
      .then(next => alive && setInfo(next))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [signedIn, householdToken, auth]);

  if (!signedIn) {
    return (
      <View style={[styles.card, styles.cardGuest]} accessibilityLabel="Konto">
        <View style={styles.row}>
          <View style={styles.icon}>
            <Ionicons name="person-outline" size={22} color={colors.ink} />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>Logg inn</Text>
            <Text style={styles.meta}>Få middagene og lista på alle telefonene dine, også i appen på Hjem-skjermen.</Text>
          </View>
        </View>
        <Button label="Logg inn eller lag konto" icon="log-in-outline" onPress={auth.showLogin} style={styles.button} />
      </View>
    );
  }

  const members = info?.members ?? [];
  return (
    <View style={styles.card} accessibilityLabel="Konto">
      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons name="person" size={22} color={colors.ink} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{info?.name || 'Konto'}</Text>
          <Text style={styles.meta}>Logget inn som {auth.email}</Text>
        </View>
      </View>
      {members.length > 0 && (
        <Text style={styles.detail}>
          {members.length === 1 ? 'Bare du i husstanden. Del med samboer under.' : `I husstanden: ${members.join(', ')}`}
        </Text>
      )}
      {info?.is_owner && <Text style={styles.detail}>Du er eier, og kan endre butikkene fra alle telefonene dine.</Text>}
      {auth.linkError && (
        <View style={styles.errorRow}>
          <Text style={styles.error}>Kontoen ble ikke koblet: {auth.linkError}</Text>
          <Pressable accessibilityRole="button" onPress={auth.retryLink}>
            <Text style={styles.link}>Prøv igjen</Text>
          </Pressable>
        </View>
      )}
      <Button
        label={confirmSignOut ? 'Trykk igjen for å logge ut' : 'Logg ut'}
        icon="log-out-outline"
        variant="outline"
        onPress={() => {
          if (!confirmSignOut) {
            setConfirmSignOut(true);
            return;
          }
          auth.signOut();
        }}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardGuest: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.limeStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 26,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSoft,
  },
  detail: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  errorRow: {
    gap: spacing.xs,
  },
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.danger,
  },
  link: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.green,
    textDecorationLine: 'underline',
  },
  button: {
    alignSelf: 'flex-start',
  },
});

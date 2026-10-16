import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AccountCard } from '@/components/AccountCard';
import { InstallCard } from '@/components/InstallCard';
import { Eyebrow, Page, Title } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useHistory } from '@/lib/history';
import { useMeals } from '@/lib/meals-store';
import { daysUntil, useShopping } from '@/lib/shopping';
import { useApp } from '@/lib/store';
import { useSync } from '@/lib/sync';

type Item = { href: Href; icon: keyof typeof Ionicons.glyphMap; title: string; text: string };

export default function MoreScreen() {
  const router = useRouter();
  const { householdToken } = useMeals();
  const { status } = useSync();
  const { trips } = useHistory();
  const { isOwner } = useApp();
  const { state } = useShopping();
  const fridge = Object.values(state.fridge);
  const soon = fridge.filter(item => (daysUntil(item.expires) ?? 99) <= 2).length;

  const items: Item[] = [
    {
      href: '/kjoleskap',
      icon: 'snow-outline',
      title: 'Kjøleskap',
      text: fridge.length
        ? `${fridge.length} ${fridge.length === 1 ? 'vare' : 'varer'}${soon ? `, ${soon} går snart ut` : ''}`
        : 'Rester og sparemiddag',
    },
    {
      href: '/samboer',
      icon: 'people-outline',
      title: 'Del med samboer',
      text: householdToken
        ? status === 'offline'
          ? 'Delt, men uten nett akkurat nå'
          : 'Delt – dere ser samme uke og liste'
        : 'Se samme ukeplan og handleliste, live',
    },
    {
      href: '/historikk',
      icon: 'receipt-outline',
      title: 'Handlehistorikk',
      text: trips.length ? `${trips.length} ${trips.length === 1 ? 'handletur' : 'handleturer'}` : 'Ingen handleturer ennå',
    },
    { href: '/butikker', icon: 'storefront-outline', title: 'Butikker', text: 'Rekkefølgen i Kiwi, Coop og Rema' },
    {
      href: '/eier',
      icon: isOwner ? 'lock-open-outline' : 'lock-closed-outline',
      title: 'Eier',
      text: isOwner ? 'Denne telefonen kan endre butikkene' : 'Bare eieren kan endre butikkene',
    },
  ];

  return (
    <Page maxWidth={760}>
      <View style={styles.header}>
        <Eyebrow>Mer</Eyebrow>
        <Title size="lg">Innstillinger og mer</Title>
      </View>
      <View style={styles.list}>
        <AccountCard />
        <InstallCard />
        {items.map(item => (
          <Pressable
            key={item.title}
            accessibilityRole="link"
            accessibilityLabel={item.title}
            onPress={() => router.push(item.href)}
            style={({ hovered, pressed }: { pressed: boolean; hovered?: boolean }) => [styles.card, (hovered || pressed) && styles.cardActive]}>
            <View style={styles.icon}>
              <Ionicons name={item.icon} size={22} color={colors.ink} />
            </View>
            <View style={styles.text}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.text}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.ink} />
          </Pressable>
        ))}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, marginBottom: spacing.xl },
  list: { gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: spacing.lg,
    minHeight: 76,
  },
  cardActive: { borderColor: colors.ink },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 26, color: colors.ink },
  meta: { fontFamily: fonts.mono, fontSize: 12, color: colors.inkSoft },
});

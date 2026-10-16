import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Button } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/constants/theme';

const DISMISSED_KEY = 'handleklar.installDismissed';

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// Er appen åpnet fra Hjem-skjermen (som egen app), og ikke i nettleseren?
export function isStandalone(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return true;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || Boolean(window.matchMedia?.('(display-mode: standalone)').matches);
}

function device(): 'ios' | 'android' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  const agent = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(agent) || (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(agent)) return 'android';
  return 'other';
}

// Messenger, Facebook og Instagram åpner lenker i sin egen nettleser. Der går
// det ikke an å legge appen på Hjem-skjermen.
function inAppBrowser(): string | null {
  if (typeof navigator === 'undefined') return null;
  const agent = navigator.userAgent;
  if (/FBAN|FBAV|Messenger/.test(agent)) return 'Messenger/Facebook';
  if (/Instagram/.test(agent)) return 'Instagram';
  if (/Snapchat/.test(agent)) return 'Snapchat';
  return null;
}

// Forklarer hvordan du får Handleklar som app på telefonen. `dismissible` gir et
// lite kryss, så kortet kan skjules på forsiden.
export function InstallCard({ dismissible = false, style }: { dismissible?: boolean; style?: StyleProp<ViewStyle> }) {
  const [visible, setVisible] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    let dismissed = false;
    try {
      dismissed = dismissible && localStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      // Privat modus: vis kortet.
    }
    if (dismissed) return;
    setVisible(true);
    // Android/Chrome kan installere med ett trykk.
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, [dismissible]);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // ignorer
    }
  }

  const kind = device();
  const inApp = inAppBrowser();

  return (
    <View style={[styles.card, style]} accessibilityLabel="Få Handleklar som app">
      <View style={styles.header}>
        <View style={styles.icon}>
          <Ionicons name="phone-portrait-outline" size={20} color={colors.ink} />
        </View>
        <Text style={styles.title}>Få Handleklar som app</Text>
        {dismissible && (
          <Pressable accessibilityRole="button" accessibilityLabel="Skjul" onPress={dismiss} hitSlop={10}>
            <Ionicons name="close" size={20} color={colors.inkSoft} />
          </Pressable>
        )}
      </View>

      {inApp ? (
        <Text style={styles.body}>
          Du er inne i {inApp}. Trykk på de tre prikkene og velg «Åpne i Safari» (eller nettleseren din). Der kan du legge
          appen på Hjem-skjermen.
        </Text>
      ) : prompt ? (
        <>
          <Text style={styles.body}>Legg Handleklar på Hjem-skjermen, så åpner den som en vanlig app.</Text>
          <Button
            label="Installer appen"
            icon="download-outline"
            onPress={async () => {
              await prompt.prompt();
              setPrompt(null);
            }}
            style={styles.button}
          />
        </>
      ) : kind === 'ios' ? (
        <View style={styles.steps}>
          <Step n={1}>
            Trykk på Del-knappen <Ionicons name="share-outline" size={15} color={colors.ink} /> i Safari (nederst eller i
            adressefeltet).
          </Step>
          <Step n={2}>Bla ned og velg «Legg til på Hjem-skjerm».</Step>
          <Step n={3}>Trykk «Legg til». Åpne Handleklar fra ikonet og logg inn der.</Step>
        </View>
      ) : (
        <Text style={styles.body}>
          Åpne siden på telefonen og velg «Legg til på startskjermen» (Android) eller «Legg til på Hjem-skjerm» i Safari
          (iPhone).
        </Text>
      )}
    </View>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepNumber}>{n}</Text>
      <Text style={styles.stepText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.lime,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    backgroundColor: colors.limeStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 24,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink,
  },
  button: {
    alignSelf: 'flex-start',
  },
  steps: {
    gap: spacing.xs,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 22,
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 21,
    color: colors.green,
  },
  stepText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink,
  },
});

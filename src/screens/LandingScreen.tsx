import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions, Linking } from 'react-native';
import { Text, Title, Paragraph } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { skeuColors, skeuStyles } from '../utils';

const { width } = Dimensions.get('window');

// --- Components ---

const ConvexCard: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
    <View style={[styles.convexCard, style]}>
        {children}
    </View>
);

const ConcaveIcon: React.FC<{ icon: string; size?: number; color?: string }> = ({ icon, size = 28, color = skeuColors.textSecondary }) => (
    <View style={[styles.concaveBubble, { width: size * 2.2, height: size * 2.2, borderRadius: size * 1.5, alignItems: 'center', justifyContent: 'center' }]}>
        <MaterialCommunityIcons name={icon as any} size={size} color={color} />
    </View>
);

const FeatureCard: React.FC<{ icon: string; title: string; description: string }> = ({ icon, title, description }) => (
    <ConvexCard style={styles.featureCard}>
        <View style={styles.featureIconContainer}>
            <ConcaveIcon icon={icon} color={skeuColors.primary} />
        </View>
        <Title style={styles.featureTitle}>{title}</Title>
        <Paragraph style={styles.featureDescription}>{description}</Paragraph>
    </ConvexCard>
);

const StepItem: React.FC<{ number: number; title: string; description: string }> = ({ number, title, description }) => (
    <View style={styles.stepItem}>
        <View style={styles.stepNumberContainer}>
            <View style={[styles.concaveBubble, styles.stepBubble]}>
                <Text style={styles.stepNumber}>{number}</Text>
            </View>
            {/* Connecting Line */}
            {number < 3 && <View style={styles.stepLine} />}
        </View>
        <View style={styles.stepContent}>
            <Title style={styles.stepTitle}>{title}</Title>
            <Paragraph style={styles.stepDesc}>{description}</Paragraph>
        </View>
    </View>
);

// --- Screen ---

export const LandingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [ctaPressed, setCtaPressed] = useState(false);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* 1. Hero Section */}
                <View style={styles.heroSection}>
                    <ConvexCard style={styles.logoContainer}>
                        <MaterialCommunityIcons name="microphone" size={60} color={skeuColors.primary} />
                    </ConvexCard>

                    <Text style={styles.appName}>MeetingAI</Text>
                    <Text style={styles.tagline}>Future of Meetings, Today.</Text>
                    <Paragraph style={styles.heroDesc}>
                        Transform your meetings with crystal clear recording, intelligent AI summaries, and secure local storage.
                    </Paragraph>

                    <TouchableOpacity
                        activeOpacity={1}
                        onPressIn={() => setCtaPressed(true)}
                        onPressOut={() => setCtaPressed(false)}
                        onPress={() => navigation.navigate('Home')}
                        style={[
                            styles.ctaButton,
                            ctaPressed ? styles.ctaPressed : styles.ctaNormal
                        ]}
                    >
                        <Text style={[styles.ctaText, ctaPressed && { color: skeuColors.textSecondary }]}>
                            {ctaPressed ? "Launching..." : "Get Started"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 2. Features Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Why MeetingAI?</Text>
                    <View style={styles.featuresGrid}>
                        <FeatureCard
                            icon="microphone-outline"
                            title="Smart Recording"
                            description="High-fidelity audio with noise cancellation."
                        />
                        <FeatureCard
                            icon="creation"
                            title="AI Summary"
                            description="Summaries & action items in seconds."
                        />
                        <FeatureCard
                            icon="shield-lock-outline"
                            title="Secure Storage"
                            description="AES-256 encrypted local storage."
                        />
                        <FeatureCard
                            icon="translate"
                            title="Multi-language"
                            description="Support for 30+ languages."
                        />
                        <FeatureCard
                            icon="export-variant"
                            title="Easy Export"
                            description="Export to PDF, Markdown, or Notion."
                        />
                        <FeatureCard
                            icon="calendar-sync"
                            title="Calendar Sync"
                            description="Auto-tag meetings from your calendar."
                        />
                    </View>
                </View>

                {/* 3. How It Works */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>How It Works</Text>
                    <View style={styles.stepsContainer}>
                        <StepItem
                            number={1}
                            title="Record"
                            description="Tap the big red button to start recording safely."
                        />
                        <StepItem
                            number={2}
                            title="Process"
                            description="Our local AI processes speech-to-text instantly."
                        />
                        <StepItem
                            number={3}
                            title="Review"
                            description="Get a structured summary and action plan."
                        />
                    </View>
                </View>

                {/* 4. Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerBrand}>MeetingAI © 2026</Text>
                    <View style={styles.footerLinks}>
                        <TouchableOpacity style={styles.footerLink}><Text style={styles.linkText}>Privacy</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.footerLink}><Text style={styles.linkText}>Terms</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.footerLink}><Text style={styles.linkText}>Contact</Text></TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

// --- Styles ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: skeuColors.background,
    },
    scrollContent: {
        paddingVertical: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
    },

    // Section Setup
    heroSection: {
        alignItems: 'center',
        marginBottom: 80,
        width: '100%',
        maxWidth: 800,
    },
    section: {
        width: '100%',
        maxWidth: 1000,
        marginBottom: 80,
        alignItems: 'center',
    },
    sectionHeader: {
        fontSize: 28,
        fontWeight: '700',
        color: skeuColors.textPrimary,
        marginBottom: 40,
        letterSpacing: 0.5,
    },

    // Hero Styles
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 40,
        marginBottom: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appName: {
        fontSize: 42,
        fontWeight: '800',
        color: skeuColors.textPrimary,
        marginBottom: 12,
        letterSpacing: -1,
    },
    tagline: {
        fontSize: 20,
        fontWeight: '600',
        color: skeuColors.primary,
        marginBottom: 16,
        textAlign: 'center',
    },
    heroDesc: {
        fontSize: 16,
        color: skeuColors.textSecondary,
        textAlign: 'center',
        maxWidth: 600,
        lineHeight: 26,
        marginBottom: 40,
    },

    // CTA Button
    ctaButton: {
        width: 220,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaNormal: {
        ...skeuStyles.neumorphicCard, // Use shared outer shadow
        // Override a bit for button specific feel if needed
    },
    ctaPressed: {
        ...skeuStyles.neumorphicInset, // Use shared inner shadow
        marginTop: 2, // Physical movement feeling
    },
    ctaText: {
        fontSize: 18,
        fontWeight: '700',
        // Low Contrast rule (not pure black) (Or switch to Primary if readability needs)
        // Actually, let's stick to Primary Color for text to make it pop but still follow rules
        color: skeuColors.primary,
    },

    // Features
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 32,
        width: '100%',
    },
    featureCard: {
        width: width > 700 ? 300 : '100%',
        padding: 32,
        alignItems: 'center',
        borderRadius: 40, // More rounded (Rule 4)
    },
    featureIconContainer: {
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: skeuColors.textPrimary,
        marginBottom: 12,
        textAlign: 'center',
    },
    featureDescription: {
        fontSize: 14,
        color: skeuColors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },

    // Steps
    stepsContainer: {
        width: '100%',
        maxWidth: 600,
    },
    stepItem: {
        flexDirection: 'row',
        marginBottom: 40,
    },
    stepNumberContainer: {
        alignItems: 'center',
        marginRight: 24,
    },
    stepBubble: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumber: {
        fontSize: 20,
        fontWeight: '800',
        color: skeuColors.primary,
    },
    stepLine: {
        width: 2,
        flex: 1,
        backgroundColor: skeuColors.shadowDark,
        opacity: 0.3,
        marginVertical: 8,
    },
    stepContent: {
        flex: 1,
        paddingTop: 8,
    },
    stepTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: skeuColors.textPrimary,
        marginBottom: 6,
    },
    stepDesc: {
        fontSize: 15,
        color: skeuColors.textSecondary,
        lineHeight: 24,
    },

    // Footer
    footer: {
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.03)',
        paddingTop: 40,
        alignItems: 'center',
    },
    footerBrand: {
        fontSize: 14,
        color: skeuColors.textMuted,
        marginBottom: 16,
        fontWeight: '600',
    },
    footerLinks: {
        flexDirection: 'row',
        gap: 24,
    },
    footerLink: {
        padding: 8,
    },
    linkText: {
        fontSize: 14,
        color: skeuColors.textSecondary,
    },

    // Shared Primitives
    convexCard: {
        // backgroundColor: skeuColors.background (Already in theme)
        ...skeuStyles.neumorphicCard,
    },
    concaveBubble: {
        // backgroundColor: skeuColors.background (Already in theme)
        ...skeuStyles.neumorphicInset,
    },
});

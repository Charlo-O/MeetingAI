import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Text, Title, Paragraph } from 'react-native-paper';
import { skeuColors, skeuStyles } from '../utils';

const { width } = Dimensions.get('window');

interface SkeuDialogButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface SkeuDialogProps {
    visible: boolean;
    title: string;
    message?: string;
    buttons?: SkeuDialogButton[];
    onDismiss?: () => void;
}

export const SkeuDialog: React.FC<SkeuDialogProps> = ({
    visible,
    title,
    message,
    buttons = [{ text: '确定' }],
    onDismiss,
}) => {
    const handleButtonPress = (button: SkeuDialogButton) => {
        if (button.onPress) {
            button.onPress();
        }
        if (onDismiss) {
            onDismiss();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onDismiss}
        >
            <View style={styles.overlay}>
                <View style={styles.dialogContainer}>
                    <Title style={styles.title}>{title}</Title>
                    {message && <Paragraph style={styles.message}>{message}</Paragraph>}

                    <View style={styles.buttonContainer}>
                        {buttons.map((button, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.button,
                                    button.style === 'cancel' && styles.buttonCancel,
                                    button.style === 'destructive' && styles.buttonDestructive,
                                ]}
                                onPress={() => handleButtonPress(button)}
                                activeOpacity={0.9}
                            >
                                <Text
                                    style={[
                                        styles.buttonText,
                                        button.style === 'cancel' && styles.buttonTextCancel,
                                        button.style === 'destructive' && styles.buttonTextDestructive,
                                    ]}
                                >
                                    {button.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    dialogContainer: {
        width: Math.min(width - 64, 340),
        ...skeuStyles.neumorphicCard,
        padding: 28,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: skeuColors.textPrimary,
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: skeuColors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
        justifyContent: 'center',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        ...skeuStyles.neumorphicCard,
    },
    buttonCancel: {
        // Same convex style, different text color
    },
    buttonDestructive: {
        backgroundColor: skeuColors.recordRed,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: skeuColors.primary,
    },
    buttonTextCancel: {
        color: skeuColors.textSecondary,
    },
    buttonTextDestructive: {
        color: '#FFFFFF',
    },
});

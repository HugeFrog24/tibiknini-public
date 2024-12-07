import React from 'react';
import { 
    TextField, 
    LinearProgress,
    Typography,
    Box
} from '@mui/material';
import { object, string, ref } from 'yup';

// Password strength calculation
const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;

    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    
    // Contains number
    if (/\d/.test(password)) strength += 25;
    
    // Contains lowercase letter
    if (/[a-z]/.test(password)) strength += 25;
    
    // Contains uppercase letter
    if (/[A-Z]/.test(password)) strength += 25;

    return strength;
};

// Get color based on password strength
const getStrengthColor = (strength: number): string => {
    if (strength <= 25) return '#f44336'; // red
    if (strength <= 50) return '#ff9800'; // orange
    if (strength <= 75) return '#ffc107'; // yellow
    return '#4caf50'; // green
};

// Get label based on password strength
const getStrengthLabel = (strength: number): string => {
    if (strength <= 25) return 'Weak';
    if (strength <= 50) return 'Fair';
    if (strength <= 75) return 'Good';
    return 'Strong';
};

interface PasswordFieldProps {
    password: string;
    setPassword: (value: string) => void;
    error?: boolean;
    helperText?: string;
    label?: string;
    showStrengthMeter?: boolean;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
    password,
    setPassword,
    error = false,
    helperText = '',
    label = 'Password',
    showStrengthMeter = true
}) => {
    const strength = calculatePasswordStrength(password);

    return (
        <Box>
            <TextField
                type="password"
                label={label}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                error={error}
                helperText={helperText}
                variant="outlined"
            />
            {showStrengthMeter && password && (
                <Box sx={{ mt: 1 }}>
                    <LinearProgress
                        variant="determinate"
                        value={strength}
                        sx={{
                            height: 8,
                            borderRadius: 5,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: getStrengthColor(strength),
                            },
                        }}
                    />
                    <Typography
                        variant="caption"
                        sx={{
                            color: getStrengthColor(strength),
                            mt: 0.5,
                            display: 'block'
                        }}
                    >
                        Password Strength: {getStrengthLabel(strength)}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

interface PasswordValidationProps {
    password: string;
    setPassword: (value: string) => void;
    confirmPassword: string;
    setConfirmPassword: (value: string) => void;
    passwordError?: boolean;
    confirmPasswordError?: boolean;
    passwordHelperText?: string;
    confirmPasswordHelperText?: string;
}

export const PasswordValidation: React.FC<PasswordValidationProps> = ({
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError = false,
    confirmPasswordError = false,
    passwordHelperText = '',
    confirmPasswordHelperText = ''
}) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <PasswordField
                password={password}
                setPassword={setPassword}
                error={passwordError}
                helperText={passwordHelperText}
            />
            <PasswordField
                password={confirmPassword}
                setPassword={setConfirmPassword}
                error={confirmPasswordError}
                helperText={confirmPasswordHelperText}
                label="Confirm Password"
                showStrengthMeter={false}
            />
        </Box>
    );
};

// Yup validation schema for password fields
export const passwordValidationSchema = object({
    password: string()
        .min(8, 'Password must be at least 8 characters')
        .matches(/[0-9]/, 'Password must contain at least one number')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .required('Password is required'),
    password2: string()
        .oneOf([ref('password')], 'Passwords must match')
        .required('Please confirm your password')
});

// Validation function for manual validation
export const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    return null;
};

export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords must match';
    return null;
};

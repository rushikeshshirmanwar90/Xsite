import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { domain } from '@/lib/domain';

/**
 * Test component to debug completion status state management directly in React Native
 * Add this to your app temporarily to test the state management
 */
const TestFetchCompletion = () => {
    const [testResults, setTestResults] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [miniSectionCompletions, setMiniSectionCompletions] = useState<{[key: string]: boolean}>({});

    // Test data - replace with your actual IDs
    const testData = {
        miniSectionId: '6983a1189eea6a7c519efcbb', // Foundation mini-section from your logs
        projectId: 'YOUR_PROJECT_ID_HERE',
        sectionId: 'YOUR_SECTION_ID_HERE'
    };

    const addResult = (message: string) => {
        console.log(message);
        setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const clearResults = () => {
        setTestResults([]);
    };

    // Helper function to validate MongoDB ObjectId
    const isValidMongoId = (id: string) => {
        return /^[0-9a-fA-F]{24}$/.test(id);
    };

    // Test the exact fetchCompletionStatus logic from details.tsx
    const testFetchCompletionStatus = async () => {
        setIsLoading(true);
        addResult('🧪 Testing fetchCompletionStatus logic...');
        
        try {
            addResult('📡 Fetching mini-sections list...');
            const sectionsResponse = await fetch(`${domain}/api/section?sectionId=${testData.sectionId}`);
            
            if (!sectionsResponse.ok) {
                addResult(`❌ Mini-sections fetch failed: ${sectionsResponse.status}`);
                return;
            }
            
            const sectionsData = await sectionsResponse.json();
            addResult(`📊 Found ${Array.isArray(sectionsData) ? sectionsData.length : 0} mini-sections`);
            
            if (sectionsData && Array.isArray(sectionsData)) {
                const completions: {[key: string]: boolean} = {};
                
                for (const miniSection of sectionsData) {
                    if (!miniSection._id || !isValidMongoId(miniSection._id)) {
                        addResult(`⚠️ Invalid mini-section ID: ${miniSection._id}`);
                        completions[miniSection._id] = false;
                        continue;
                    }
                    
                    try {
                        const miniUrl = `${domain}/api/completion?updateType=minisection&id=${miniSection._id}`;
                        addResult(`📡 Fetching ${miniSection.name} status...`);
                        
                        const fetchResponse = await fetch(miniUrl);
                        
                        if (!fetchResponse.ok) {
                            addResult(`❌ ${miniSection.name} fetch failed: ${fetchResponse.status}`);
                            completions[miniSection._id] = false;
                            continue;
                        }
                        
                        const responseData = await fetchResponse.json();
                        
                        if (responseData.success && responseData.data) {
                            completions[miniSection._id] = responseData.data.isCompleted || false;
                            addResult(`✅ ${miniSection.name}: ${completions[miniSection._id]} (${typeof completions[miniSection._id]})`);
                        } else {
                            completions[miniSection._id] = false;
                            addResult(`⚠️ ${miniSection.name}: defaulted to false`);
                        }
                    } catch (miniError: any) {
                        addResult(`❌ ${miniSection.name} error: ${miniError.message}`);
                        completions[miniSection._id] = false;
                    }
                }
                
                // Update state - this is the critical part
                addResult('🔄 Updating miniSectionCompletions state...');
                addResult(`Previous state: ${JSON.stringify(miniSectionCompletions)}`);
                addResult(`New state: ${JSON.stringify(completions)}`);
                
                setMiniSectionCompletions(completions);
                
                addResult('✅ State update completed');
            }
            
        } catch (error: any) {
            addResult(`❌ fetchCompletionStatus failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const testToggleFunctionality = async () => {
        setIsLoading(true);
        addResult('🧪 Testing toggle functionality...');
        
        try {
            const payload = {
                updateType: 'minisection',
                id: testData.miniSectionId
            };
            
            addResult(`📡 Toggling ${testData.miniSectionId}...`);
            
            const fetchResponse = await fetch(`${domain}/api/completion`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            
            if (!fetchResponse.ok) {
                addResult(`❌ Toggle failed: ${fetchResponse.status}`);
                return;
            }
            
            const responseData = await fetchResponse.json();
            
            if (responseData.success) {
                const newCompletionStatus = responseData.data?.isCompleted;
                addResult(`✅ API returned: ${newCompletionStatus} (${typeof newCompletionStatus})`);
                
                if (typeof newCompletionStatus === 'boolean') {
                    // Update state with API response
                    setMiniSectionCompletions(prev => {
                        const newState = {
                            ...prev,
                            [testData.miniSectionId]: newCompletionStatus
                        };
                        addResult(`🔄 State updated: ${JSON.stringify(newState)}`);
                        return newState;
                    });
                } else {
                    addResult('⚠️ API response isCompleted is not boolean');
                }
            }
            
        } catch (error: any) {
            addResult(`❌ Toggle failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Monitor state changes
    useEffect(() => {
        addResult(`🔍 State changed: ${JSON.stringify(miniSectionCompletions)}`);
        Object.entries(miniSectionCompletions).forEach(([id, completed]) => {
            addResult(`  - ${id}: ${completed ? 'COMPLETED' : 'INCOMPLETE'}`);
        });
    }, [miniSectionCompletions]);

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Completion State Test</Text>
            <Text style={styles.subtitle}>Domain: {domain}</Text>
            <Text style={styles.subtitle}>Mini-section ID: {testData.miniSectionId}</Text>
            
            {/* Current State Display */}
            <View style={styles.stateContainer}>
                <Text style={styles.stateTitle}>Current State:</Text>
                <Text style={styles.stateText}>
                    {JSON.stringify(miniSectionCompletions, null, 2)}
                </Text>
                
                {/* UI Simulation */}
                <Text style={styles.stateTitle}>UI Simulation:</Text>
                {Object.entries(miniSectionCompletions).map(([id, completed]) => (
                    <View key={id} style={[
                        styles.simulatedButton,
                        completed && styles.simulatedButtonCompleted
                    ]}>
                        <Text style={[
                            styles.simulatedButtonText,
                            completed && styles.simulatedButtonTextCompleted
                        ]}>
                            {completed ? '✓ Completed' : '○ Complete'}
                        </Text>
                    </View>
                ))}
            </View>
            
            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={[styles.button, styles.testButton]} 
                    onPress={testFetchCompletionStatus}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Test Fetch Status</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.button, styles.toggleButton]} 
                    onPress={testToggleFunctionality}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Test Toggle</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.button, styles.clearButton]} 
                    onPress={clearResults}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Clear Results</Text>
                </TouchableOpacity>
            </View>
            
            {isLoading && (
                <Text style={styles.loading}>Testing in progress...</Text>
            )}
            
            <ScrollView style={styles.resultsContainer}>
                {testResults.map((result, index) => (
                    <Text key={index} style={styles.resultText}>
                        {result}
                    </Text>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 4,
    },
    stateContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    stateTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 8,
    },
    stateText: {
        fontSize: 12,
        color: '#64748B',
        fontFamily: 'monospace',
        marginBottom: 12,
    },
    simulatedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    simulatedButtonCompleted: {
        backgroundColor: '#ECFDF5',
        borderColor: '#059669',
    },
    simulatedButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    simulatedButtonTextCompleted: {
        color: '#059669',
    },
    buttonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        marginVertical: 16,
        gap: 8,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    testButton: {
        backgroundColor: '#3B82F6',
    },
    toggleButton: {
        backgroundColor: '#059669',
    },
    clearButton: {
        backgroundColor: '#EF4444',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    loading: {
        textAlign: 'center',
        color: '#3B82F6',
        fontSize: 16,
        fontWeight: '500',
        marginVertical: 8,
    },
    resultsContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
    },
    resultText: {
        fontSize: 12,
        color: '#1E293B',
        marginBottom: 4,
        fontFamily: 'monospace',
    },
});

export default TestFetchCompletion;
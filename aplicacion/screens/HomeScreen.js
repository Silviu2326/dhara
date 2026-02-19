import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Sidebar from '../Sidebar';
import Header from '../Header';

// Import individual screens
import DashboardScreen from './DashboardScreen';
import ChatScreen from './ChatScreen';
import ExploreTherapistsScreen from './ExploreTherapistsScreen';
import AppointmentsScreen from './AppointmentsScreen';
import CompleteFavoritesNavigation from '../CompleteFavoritesNavigation';
import DocumentsScreen from './DocumentsScreen';
import DictionaryScreen from './DictionaryScreen';
import ReviewsScreen from './ReviewsScreen';
import PaymentHistoryScreen from './PaymentHistoryScreen';
import NotificationsScreen from './NotificationsScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';
import HelpCenterScreen from './HelpCenterScreen';
import PrivacyScreen from './PrivacyScreen';
import AgendaScreen from './AgendaScreen';

const HomeScreen = ({ user, onLogout }) => {
  const [selectedSection, setSelectedSection] = useState('dashboard');
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const isWeb = Platform.OS === 'web';

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleSectionChange = (section) => {
    setSelectedSection(section);
  };

  const [navigationParams, setNavigationParams] = useState({});

  const renderContent = () => {
    const screenProps = {
      user,
      navigation: {
        navigate: (screen, params) => {
          setSelectedSection(screen);
          setNavigationParams(params || {});
        },
        goBack: () => setSelectedSection('dashboard')
      },
      route: {
        params: navigationParams
      }
    };

    switch (selectedSection) {
      case 'dashboard': return <DashboardScreen {...screenProps} />;
      case 'agenda': return <AgendaScreen {...screenProps} />;
      case 'explore-therapists': return <ExploreTherapistsScreen {...screenProps} />;
      case 'appointments': return <AppointmentsScreen user={user} />;
      case 'chat': return <ChatScreen user={user} />;
      case 'favorites': return <CompleteFavoritesNavigation />;
      case 'documents': return <DocumentsScreen user={user} />;
      case 'dictionary': return <DictionaryScreen user={user} />;
      case 'reviews': return <ReviewsScreen user={user} />;
      case 'payment-history': return <PaymentHistoryScreen user={user} />;
      case 'notifications': return <NotificationsScreen user={user} />;
      case 'profile': return <ProfileScreen {...screenProps} />;
      case 'settings': return <SettingsScreen user={user} />;
      case 'help-center': return <HelpCenterScreen user={user} />;
      case 'privacy': return <PrivacyScreen user={user} />;
      default: return <DashboardScreen {...screenProps} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.mainLayout}>
        {/* Header - Always visible */}
        <Header
          user={user}
          onToggleSidebar={toggleSidebar}
          onLogout={onLogout}
          onNavigate={(section) => setSelectedSection(section)}
          selectedSection={selectedSection}
        />

        {/* Content Layout */}
        <View style={styles.contentLayout}>
          {/* Sidebar */}
          <Sidebar
            user={user}
            selectedSection={selectedSection}
            onSectionChange={handleSectionChange}
            onLogout={onLogout}
            isVisible={sidebarVisible}
            onClose={() => setSidebarVisible(false)}
          />

          {/* Main Content Area */}
          <View style={[styles.contentArea, sidebarVisible && isWeb && styles.contentAreaWithSidebar]}>
            {/* Scrollable Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {renderContent()}
            </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3EEE9',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'column',
  },
  contentLayout: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#F3EEE9',
  },
  contentAreaWithSidebar: {
    marginLeft: 280, // Espacio para la sidebar en web cuando está visible
  },
  content: {
    flex: 1,
  },
});

export default HomeScreen;
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FactoryProvider } from './context/FactoryContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { EmployeesView } from './views/EmployeesView';
import { PayrollView } from './views/PayrollView';
import { EquipmentMachineryView } from './views/EquipmentMachineryView';
import { InventoryView } from './views/InventoryView';
import { WorkInProgressView } from './views/WorkInProgressView';
import { FinishedProductsView } from './views/FinishedProductsView';
import { ToolsView } from './views/ToolsView';
import { FinancialsView } from './views/FinancialsView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';

function MainApp() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'employees':
        return <EmployeesView />;
      case 'payroll':
        return <PayrollView />;
      case 'equipment':
        return <EquipmentMachineryView />;
      case 'inventory':
        return <InventoryView />;
      case 'wip':
        return <WorkInProgressView />;
      case 'finished':
        return <FinishedProductsView />;
      case 'tools':
        return <ToolsView />;
      case 'financials':
        return <FinancialsView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-row selection:bg-[#007BFF] selection:text-white">
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          activeTab={activeTab}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <FactoryProvider>
      <MainApp />
    </FactoryProvider>
  );
}

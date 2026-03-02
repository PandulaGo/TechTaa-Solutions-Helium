import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import VehicleCreatePage from './pages/VehicleCreatePage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleEditPage from './pages/VehicleEditPage';
import FuelEntryCreatePage from './pages/FuelEntryCreatePage';
import FuelEntryEditPage from './pages/FuelEntryEditPage';
import FuelEntriesPage from './pages/FuelEntriesPage';
import ChargingEntryCreatePage from './pages/ChargingEntryCreatePage';
import ChargingEntryEditPage from './pages/ChargingEntryEditPage';
import ChargingEntriesPage from './pages/ChargingEntriesPage';
import MaintenanceEntryCreatePage from './pages/MaintenanceEntryCreatePage';
import MaintenanceEntryEditPage from './pages/MaintenanceEntryEditPage';
import MaintenanceEntriesPage from './pages/MaintenanceEntriesPage';

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={HomePage} />
        <Route path="/dashboard" exact component={DashboardPage} />
        <Route path="/vehicles/new" exact component={VehicleCreatePage} />
        <Route path="/vehicles/:id/edit" exact component={VehicleEditPage} />
        <Route path="/vehicles" exact component={VehiclesPage} />
        <Route path="/fuel-entries/new" exact component={FuelEntryCreatePage} />
        <Route path="/fuel-entries/:id/edit" exact component={FuelEntryEditPage} />
        <Route path="/fuel-entries" exact component={FuelEntriesPage} />
        <Route path="/charging-entries/new" exact component={ChargingEntryCreatePage} />
        <Route path="/charging-entries/:id/edit" exact component={ChargingEntryEditPage} />
        <Route path="/charging-entries" exact component={ChargingEntriesPage} />
        <Route path="/maintenance-records/new" exact component={MaintenanceEntryCreatePage} />
        <Route path="/maintenance-records/:id/edit" exact component={MaintenanceEntryEditPage} />
        <Route path="/maintenance-records" exact component={MaintenanceEntriesPage} />
        <Route path="/login" exact component={LoginPage} />
        <Route path="/signup" exact component={SignupPage} />
      </Switch>
    </Router>
  );
};

export default App;
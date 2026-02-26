import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useHistory, useParams } from 'react-router-dom';

interface AppSettings {
  apiBaseUrl: string;
}

interface VehicleDto {
  id: string;
  name: string;
  make: string;
  model: string;
  year?: number | null;
  powertrainType: number;
  bodyType: number;
  vin?: string | null;
}

enum VehicleBodyType {
  Car = 0,
  Van = 1,
  Bike = 2,
  Truck = 3,
  Suv = 4,
}

enum PowertrainType {
  Petrol = 0,
  Diesel = 1,
  Hybrid = 2,
  Electric = 3,
}

const VehicleEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();

  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    make: '',
    model: '',
    year: '',
    bodyType: '',
    powertrainType: '',
    vin: '',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/appsettings.json');
        const data: AppSettings = await response.json();
        setApiBaseUrl(data.apiBaseUrl);
      } catch (err) {
        console.error('Failed to load appsettings.json', err);
        setError('Failed to load application settings.');
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const loadVehicle = async () => {
      if (!apiBaseUrl || !id) {
        return;
      }

      setLoadingVehicle(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<VehicleDto>(`${apiBaseUrl}/api/vehicles/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const vehicle = response.data;
        setForm({
          name: vehicle.name,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year ? vehicle.year.toString() : '',
          bodyType: vehicle.bodyType.toString(),
          powertrainType: vehicle.powertrainType.toString(),
          vin: vehicle.vin ?? '',
        });
      } catch (err: any) {
        console.error('Failed to load vehicle', err);
        const backendDetail = err?.response?.data?.detail as string | undefined;
        setError(backendDetail || 'Failed to load vehicle details.');
      } finally {
        setLoadingVehicle(false);
      }
    };

    if (!loadingSettings && apiBaseUrl) {
      loadVehicle();
    }
  }, [apiBaseUrl, id, loadingSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const validate = (): boolean => {
    if (!form.name.trim()) {
      setError('Vehicle name is required.');
      return false;
    }
    if (!form.make.trim()) {
      setError('Make is required.');
      return false;
    }
    if (!form.model.trim()) {
      setError('Model is required.');
      return false;
    }
    if (!form.bodyType) {
      setError('Vehicle body type is required.');
      return false;
    }
    if (!form.powertrainType) {
      setError('Powertrain type is required.');
      return false;
    }
    if (form.year) {
      const yearNumber = Number(form.year);
      if (Number.isNaN(yearNumber) || yearNumber < 1886 || yearNumber > new Date().getFullYear() + 1) {
        setError('Please enter a valid year.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!apiBaseUrl || !id) {
      setError('Backend URL is not ready yet. Please try again.');
      return;
    }

    if (!validate()) {
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: form.name.trim(),
        make: form.make.trim(),
        model: form.model.trim(),
        year: form.year ? Number(form.year) : null,
        bodyType: Number(form.bodyType),
        powertrainType: Number(form.powertrainType),
        vin: form.vin ? form.vin.trim() : null,
      };

      await axios.put(`${apiBaseUrl}/api/vehicles/${id}`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setSuccess('Vehicle updated successfully.');
      setTimeout(() => {
        history.push('/vehicles');
      }, 1000);
    } catch (err: any) {
      console.error('Vehicle update error', err);
      const data = err?.response?.data;
      const backendDetail = data?.detail as string | undefined;
      const backendError = data?.error as string | undefined;
      const backendTitle = data?.title as string | undefined;
      const errors = data?.errors as Record<string, string[]> | undefined;
      let validationMessage: string | undefined;
      if (errors) {
        const parts: string[] = [];
        for (const [field, messages] of Object.entries(errors)) {
          if (messages?.length) {
            parts.push(`${field}: ${messages.join(', ')}`);
          }
        }
        if (parts.length > 0) {
          validationMessage = parts.join('\n');
        }
      }

      setError(
        validationMessage || backendDetail || backendError || backendTitle || 'Failed to update vehicle.'
      );
    } finally {
      setSaving(false);
    }
  };

  const bodyTypeOptions = [
    { value: VehicleBodyType.Car.toString(), label: 'Car' },
    { value: VehicleBodyType.Van.toString(), label: 'Van' },
    { value: VehicleBodyType.Bike.toString(), label: 'Bike' },
    { value: VehicleBodyType.Truck.toString(), label: 'Truck' },
    { value: VehicleBodyType.Suv.toString(), label: 'SUV' },
  ];

  const powertrainTypeOptions = [
    { value: PowertrainType.Petrol.toString(), label: 'Petrol' },
    { value: PowertrainType.Diesel.toString(), label: 'Diesel' },
    { value: PowertrainType.Hybrid.toString(), label: 'Hybrid' },
    { value: PowertrainType.Electric.toString(), label: 'Electric' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white shadow-md rounded-lg p-6 sm:p-8">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => history.push('/dashboard')}
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
          >
            ← Back to Dashboard
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">Update Vehicle</h1>
        <p className="text-gray-600 mb-6 text-center text-sm sm:text-base">
          Modify the information for your selected vehicle.
        </p>

        {(loadingSettings || loadingVehicle) && (
          <div className="mb-4 text-indigo-600 text-sm">Loading vehicle details...</div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm whitespace-pre-line">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Family Car"
              />
            </div>

            <div>
              <label htmlFor="bodyType" className="block text-sm font-medium text-gray-700 mb-1">
                Body Type *
              </label>
              <select
                id="bodyType"
                name="bodyType"
                value={form.bodyType}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select body type</option>
                {bodyTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="powertrainType" className="block text-sm font-medium text-gray-700 mb-1">
                Powertrain *
              </label>
              <select
                id="powertrainType"
                name="powertrainType"
                value={form.powertrainType}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select powertrain</option>
                {powertrainTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">
                Make *
              </label>
              <input
                id="make"
                name="make"
                type="text"
                value={form.make}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Toyota"
              />
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                Model *
              </label>
              <input
                id="model"
                name="model"
                type="text"
                value={form.model}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Corolla"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                id="year"
                name="year"
                type="number"
                min="1886"
                max={new Date().getFullYear() + 1}
                value={form.year}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. 2020"
              />
            </div>

            <div>
              <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">
                VIN
              </label>
              <input
                id="vin"
                name="vin"
                type="text"
                value={form.vin}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Vehicle Identification Number"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() => history.push('/vehicles')}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleEditPage;

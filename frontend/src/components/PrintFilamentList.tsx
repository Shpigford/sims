import React from 'react';
import { useLocation } from 'react-router-dom';
import { Filament } from '../types/filament';

const PrintFilamentList: React.FC = () => {
  const location = useLocation();
  const filamentsFromState = (location.state as { filaments: Filament[] })?.filaments || [];

  // Sort filaments alphabetically by name (case-insensitive)
  const sortedFilaments = [...filamentsFromState].sort((a, b) => 
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  if (sortedFilaments.length === 0) {
    return <div className="p-4">No filament data provided.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Unique Filaments List</h1>
      <table className="w-full border-collapse border border-black">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-black p-2 text-left text-sm font-semibold">Color Name</th>
            <th className="border border-black p-2 text-left text-sm font-semibold">Manufacturer</th>
            <th className="border border-black p-2 text-left text-sm font-semibold">Material</th>
            <th className="border border-black p-2 text-left text-sm font-semibold">Hex Code</th>
          </tr>
        </thead>
        <tbody>
          {/* Map over the sorted array */}
          {sortedFilaments.map((filament) => (
            <tr key={filament.id}>
              <td className="border border-black p-2 text-sm">{filament.name}</td>
              <td className="border border-black p-2 text-sm">{filament.manufacturer || '-'}</td>
              <td className="border border-black p-2 text-sm">{filament.material}</td>
              <td className="border border-black p-2 text-sm">
                <div className="flex items-center">
                  <div 
                    className="h-4 w-4 border border-gray-400 mr-2" 
                    style={{ backgroundColor: filament.color }}
                  ></div>
                  {filament.color}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 1cm; /* Add some padding for printing */
            font-size: 10pt;
          }
          h1 {
            font-size: 14pt;
            margin-bottom: 1cm;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid black;
            padding: 4px;
            text-align: left;
            font-size: 9pt;
            vertical-align: top;
          }
          th {
            background-color: #e5e7eb; /* Light gray background for headers */
            font-weight: bold;
          }
          .no-print { /* Hide elements not needed for print */
            display: none;
          }
          /* Ensure color swatch background prints */
          td div[style*="backgroundColor"] {
             -webkit-print-color-adjust: exact !important;
             print-color-adjust: exact !important;
             border: 1px solid #ccc !important; /* Ensure border prints */
          }
        }
      `}</style>
    </div>
  );
};

export default PrintFilamentList; 
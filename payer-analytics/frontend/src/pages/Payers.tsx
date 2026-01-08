import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

import { apiService } from '../services/api';

interface Payer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  business_name?: string;
  business_type?: string;
  revenue_category?: string;
  zone?: string;
  data_source: string;
  confidence_score: number;
}

const Payers: React.FC = () => {
  const [payers, setPayers] = useState<Payer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [zone, setZone] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [revenueCategory, setRevenueCategory] = useState('');

  // AMAC Revenue Categories for filtering
  const amacCategories = [
    'Hotels & Restaurants',
    'Schools & Colleges',
    'Healthcare Facilities',
    'Banks & Financial Services',
    'Shopping Malls & Markets',
    'Construction Companies',
    'Transportation Services',
    'Manufacturing Industries',
    'Real Estate & Property',
    'Telecommunications',
    'Agriculture & Fisheries',
    'Entertainment & Events',
    'Professional Services',
    'Retail Trade',
    'Wholesale Trade'
  ];

  const fetchPayers = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (search) params.search = search;
      if (zone) params.zone = zone;
      if (businessType) params.business_type = businessType;

      const response = await apiService.getPayers(params);
      setPayers(response.payers || []);
    } catch (err) {
      setError('Failed to load payers data');
      console.error('Error fetching payers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayers();
  }, []);

  const handleSearch = () => {
    fetchPayers();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Payers Database
      </Typography>

      {/* Search Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Search"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Name, phone, or business..."
          sx={{ minWidth: 250 }}
        />
        <TextField
          select
          label="Revenue Category"
          variant="outlined"
          value={revenueCategory}
          onChange={(e) => setRevenueCategory(e.target.value)}
          sx={{ minWidth: 200 }}
          SelectProps={{
            native: true,
          }}
        >
          <option value="">All Categories</option>
          {amacCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </TextField>
        <TextField
          label="Zone"
          variant="outlined"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          placeholder="Filter by zone"
          sx={{ minWidth: 150 }}
        />
        <TextField
          label="Business Type"
          variant="outlined"
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          placeholder="Filter by business type"
          sx={{ minWidth: 180 }}
        />
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={handleSearch}
          sx={{ minWidth: 120, height: 56 }}
        >
          Search
        </Button>
      </Box>

      {/* Results Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Business</TableCell>
              <TableCell>Revenue Category</TableCell>
              <TableCell>Zone</TableCell>
              <TableCell>Data Source</TableCell>
              <TableCell>Confidence</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payers.length > 0 ? (
              payers.map((payer) => (
                <TableRow key={payer.id} hover>
                  <TableCell>{payer.name}</TableCell>
                  <TableCell>{payer.phone}</TableCell>
                  <TableCell>
                    {payer.business_name && (
                      <div>
                        <div>{payer.business_name}</div>
                        {payer.business_type && (
                          <Chip
                            label={payer.business_type}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payer.revenue_category || 'Uncategorized'}
                      size="small"
                      color="secondary"
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>{payer.zone || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={payer.data_source}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${Math.round(payer.confidence_score * 100)}%`}
                      size="small"
                      color={payer.confidence_score > 0.7 ? 'success' : 'warning'}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No payers found. Try adjusting your search criteria.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {payers.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {payers.length} payers
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Payers;

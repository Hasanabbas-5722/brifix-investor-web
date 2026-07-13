import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IndexState {
  nifty50: {
    value: string;
    difference: string;
    percentage: string;
    sign: string;
  };
  banknifty: {
    value: string;
    difference: string;
    percentage: string;
    sign: string;
  };
  finnifty: {
    value: string;
    difference: string;
    percentage: string;
    sign: string;
  };
}

const initialState: IndexState = {
  nifty50: { value: '0', difference: '0', percentage: '0', sign: '+' },
  banknifty: { value: '0', difference: '0', percentage: '0', sign: '+' },
  finnifty: { value: '0', difference: '0', percentage: '0', sign: '+' },
};

const indexSlice = createSlice({
  name: 'indexData',
  initialState,
  reducers: {
    updateNifty50: (state, action: PayloadAction<Partial<IndexState['nifty50']>>) => {
      state.nifty50 = { ...state.nifty50, ...action.payload };
    },
    updateBankNifty: (state, action: PayloadAction<Partial<IndexState['banknifty']>>) => {
      state.banknifty = { ...state.banknifty, ...action.payload };
    },
    updateFinNifty: (state, action: PayloadAction<Partial<IndexState['finnifty']>>) => {
      state.finnifty = { ...state.finnifty, ...action.payload };
    },
  },
});

export const { updateNifty50, updateBankNifty, updateFinNifty } = indexSlice.actions;
export default indexSlice.reducer;

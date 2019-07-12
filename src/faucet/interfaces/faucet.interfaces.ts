import { Document } from 'mongoose'

export interface FaucetDrop {
  email: string
  publickey: string
  requestip: string
  amount: number
  dropped: boolean
  error?: number
  created: number
}

export interface FaucetDropDB extends Document, FaucetDrop {}

export declare interface FaucetService {
  drop(
    email: string,
    publickey: string,
    ip: string,
    amount: number
  ): Promise<FaucetDrop>

  updateOnTransactionFailure(drop: FaucetDrop): Promise<void>
}

CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger AS $$
BEGIN
  UPDATE public.credit_wallets
  SET balance = balance + 6
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_credits();

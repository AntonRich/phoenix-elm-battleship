defmodule Battleship.Game do
  @moduledoc """
  Game server
  """
  use GenServer
  require Logger
  alias Battleship.{Game}
  alias Battleship.Game.Board

  defstruct [
    id: nil,
    attacker: nil,
    defender: nil,
    channels: [],
    rounds: [],
    over: false
  ]

  # API

  def start_link(id) do
    GenServer.start_link(__MODULE__, [id], name: ref(id))
  end

  def join(id, player_id, pid), do: try_call(id, {:join, player_id, pid})

  def get_data(id), do: try_call(id, :get_data)
  def get_data(id, player_id), do: try_call(id, {:get_data, player_id})

  def add_message(id, player_id, text), do: try_call(id, {:add_message, player_id, text})

  def player_shot(id, player_id, x: x, y: y), do: try_call(id, {:player_shot, player_id, x: x, y: y})

  # SERVER

  def init(id), do: {:ok, %__MODULE__{id: id}}

  def handle_call({:join, player_id, pid}, _from, game) do
    Logger.debug "Joinning Player to Game"

    cond do
      game.attacker != nil and game.defender != nil ->
        {:reply, {:error, "No more players allowed"}, game}
      Enum.member?([game.attacker, game.defender], player_id) ->
        {:reply, {:ok, self}, game}
      true ->
        Process.monitor(pid)
        create_board(player_id)

        game = game
        |> add_player(player_id)
        |> add_channel(pid)

        {:reply, {:ok, self}, game}
    end
  end

  def handle_call(:get_data, _from, game), do: {:reply, %{game | channels: nil}, game}
  def handle_call({:get_data, player_id}, _from, game) do
    Logger.debug "Getting Game data for player #{player_id}"

    game_data = game
    |> Map.delete(:channels)
    |> Map.put(:my_board, Board.get_data(player_id))

    opponent_id = get_opponents_id(game, player_id)

    if opponent_id != nil do
      game_data = Map.put(game_data, :opponents_board, Board.get_opponents_data(opponent_id))
    end

    {:reply, game_data, game}
  end

  def handle_call({:player_shot, player_id, x: x, y: y}, _from, game) do
    opponent_id = get_opponents_id(game, player_id)

    Board.take_shot(opponent_id, x: x, y: y)

    game = %{game | rounds: [%{player_id: player_id, x: x, y: y}]}

    {:reply, {:ok, game}, game}
  end

  def get_opponents_id(%Game{attacker: player_id, defender: nil}, player_id), do: nil
  def get_opponents_id(%Game{attacker: player_id, defender: defender}, player_id), do: defender
  def get_opponents_id(%Game{attacker: attacker, defender: player_id}, player_id), do: attacker

  def handle_info({:DOWN, _ref, :process, _pid, _reason}, game) do
    for player <- [game.attacker, game.defender], do: destroy_board(player)

    {:stop, :normal, game}
  end

  @doc """
  Creates a new Board for a given Player
  """
  defp create_board(player_id), do: Board.create(player_id)

  @doc """
  Generates global reference
  """
  defp ref(id), do: {:global, {:game, id}}

  defp add_player(%__MODULE__{attacker: nil} = game, player_id), do: %{game | attacker: player_id}
  defp add_player(%__MODULE__{defender: nil} = game, player_id), do: %{game | defender: player_id}

  defp add_channel(game, pid), do: %{game | channels: [pid | game.channels]}

  defp destroy_board(nil), do: :ok
  defp destroy_board(player_id), do: Board.destroy(player_id)

  defp try_call(id, message) do
    case GenServer.whereis(ref(id)) do
      nil ->
        {:error, "Game does not exist"}
      game ->
        GenServer.call(game, message)
    end
  end
end
